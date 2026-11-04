using AgileRetro.WebApi.Entities;
using AgileRetro.WebApi.Features.Board;
using Microsoft.AspNetCore.SignalR;

namespace AgileRetro.WebApi.Hubs;

/// <summary>
/// Realtime board channel. Clients join a session group and receive the board
/// snapshot; card writes are persisted here and broadcast to the rest of the
/// group. The connection identity established by <see cref="JoinBoard"/> is
/// what authorizes later writes, never a participant id from the payload.
/// </summary>
public sealed class BoardHub(BoardService boardService, BoardPresence presence) : Hub
{
    private const string MembershipKey = "board-membership";

    public async Task<BoardSnapshot> JoinBoard(string? code, Guid participantId)
    {
        if (string.IsNullOrWhiteSpace(code))
            throw new HubException("Session code is required.");

        var membership = await boardService.FindMembershipAsync(
            code,
            participantId,
            Context.ConnectionAborted);

        if (membership is null)
            throw new HubException("Session or participant not found.");

        Context.Items[MembershipKey] = membership;

        await Groups.AddToGroupAsync(
            Context.ConnectionId,
            GroupName(membership.SessionId),
            Context.ConnectionAborted);

        var participants = presence.Join(
            membership.SessionId,
            Context.ConnectionId,
            membership.ParticipantId,
            membership.ParticipantName);

        var cards = await boardService.GetCardsAsync(
            membership.SessionId,
            Context.ConnectionAborted);

        // The caller receives the participant list in the snapshot; everyone
        // already in the group needs the updated list.
        await Clients
            .GroupExcept(GroupName(membership.SessionId), Context.ConnectionId)
            .SendAsync("ParticipantsChanged", participants);

        return new BoardSnapshot(
            membership.SessionId,
            membership.Code,
            membership.Name,
            cards,
            participants);
    }

    public async Task<BoardCardResponse> CreateCard(CreateBoardCardRequest? request)
    {
        if (request is null)
            throw new HubException("Choose a card column and write some text.");

        if (!TryGetMembership(out var membership))
            throw new HubException("Join the board before adding cards.");

        var columnKey = request.ColumnKey?.Trim() ?? string.Empty;
        var text = ValidateText(request.Text);

        if (!BoardColumns.IsValid(columnKey))
            throw new HubException("Choose a valid column.");

        var card = await boardService.CreateCardAsync(
            membership,
            columnKey,
            text,
            Context.ConnectionAborted);

        await Clients
            .GroupExcept(GroupName(membership.SessionId), Context.ConnectionId)
            .SendAsync("CardCreated", card);

        return card;
    }

    public async Task<BoardCardResponse> UpdateCard(UpdateBoardCardRequest? request)
    {
        if (request is null)
            throw new HubException("Choose a card and write some text.");

        if (!TryGetMembership(out var membership))
            throw new HubException("Join the board before editing cards.");

        if (request.CardId == Guid.Empty)
            throw new HubException("Choose a card to edit.");

        var text = ValidateText(request.Text);

        var card = await boardService.UpdateCardAsync(
            membership,
            request.CardId,
            text,
            Context.ConnectionAborted);

        if (card is null)
            throw new HubException("Card not found or you cannot edit it.");

        await Clients
            .GroupExcept(GroupName(membership.SessionId), Context.ConnectionId)
            .SendAsync("CardUpdated", card);

        return card;
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var leave = presence.Leave(Context.ConnectionId);

        if (leave is not null)
        {
            await Clients
                .Group(GroupName(leave.SessionId))
                .SendAsync("ParticipantsChanged", leave.Participants);
        }

        await base.OnDisconnectedAsync(exception);
    }

    private static string GroupName(Guid sessionId) => $"session:{sessionId}";

    private bool TryGetMembership(out BoardMembership membership)
    {
        if (Context.Items.TryGetValue(MembershipKey, out var value) &&
            value is BoardMembership current)
        {
            membership = current;
            return true;
        }

        membership = null!;
        return false;
    }

    private static string ValidateText(string? value)
    {
        var text = value?.Trim() ?? string.Empty;

        if (text.Length == 0)
            throw new HubException("Write a card before saving it.");

        if (text.Length > 500)
            throw new HubException("Keep cards under 500 characters.");

        return text;
    }
}
