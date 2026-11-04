using AgileRetro.WebApi.Data;
using AgileRetro.WebApi.Entities;
using Microsoft.EntityFrameworkCore;

namespace AgileRetro.WebApi.Features.Board;

public sealed class BoardService(AgileRetroDbContext dbContext)
{
    public async Task<BoardMembership?> FindMembershipAsync(
        string code,
        Guid participantId,
        CancellationToken ct = default)
    {
        var normalizedCode = code.Trim();

        if (normalizedCode.Length == 0) return null;

        var session = await dbContext.Session
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Code == normalizedCode, ct);

        if (session is null) return null;

        var participant = await dbContext.Participant
            .AsNoTracking()
            .FirstOrDefaultAsync(
                p => p.Id == participantId && p.SessionId == session.Id,
                ct);

        if (participant is null) return null;

        return new BoardMembership(
            session.Id,
            session.Code,
            session.Name,
            participant.Id,
            participant.Name);
    }

    public async Task<IReadOnlyList<BoardCardResponse>> GetCardsAsync(
        Guid sessionId,
        CancellationToken ct = default)
    {
        return await (
            from card in dbContext.BoardCard.AsNoTracking()
            join participant in dbContext.Participant.AsNoTracking()
                on card.ParticipantId equals participant.Id
            where card.SessionId == sessionId
            orderby card.CreatedAt
            select new BoardCardResponse(
                card.Id,
                card.ParticipantId,
                participant.Name,
                card.ColumnKey,
                card.Text,
                card.CreatedAt))
            .ToListAsync(ct);
    }

    public async Task<BoardCardResponse> CreateCardAsync(
        BoardMembership membership,
        string columnKey,
        string text,
        CancellationToken ct = default)
    {
        var card = new BoardCard
        {
            Id = Guid.NewGuid(),
            SessionId = membership.SessionId,
            ParticipantId = membership.ParticipantId,
            ColumnKey = columnKey,
            Text = text,
            CreatedAt = DateTimeOffset.UtcNow
        };

        dbContext.BoardCard.Add(card);
        await dbContext.SaveChangesAsync(ct);

        return new BoardCardResponse(
            card.Id,
            card.ParticipantId,
            membership.ParticipantName,
            card.ColumnKey,
            card.Text,
            card.CreatedAt);
    }

    public async Task<BoardCardResponse?> UpdateCardAsync(
        BoardMembership membership,
        Guid cardId,
        string text,
        CancellationToken ct = default)
    {
        var card = await dbContext.BoardCard.FirstOrDefaultAsync(
            c => c.Id == cardId &&
                 c.SessionId == membership.SessionId &&
                 c.ParticipantId == membership.ParticipantId,
            ct);

        if (card is null) return null;

        card.Text = text;
        await dbContext.SaveChangesAsync(ct);

        return new BoardCardResponse(
            card.Id,
            card.ParticipantId,
            membership.ParticipantName,
            card.ColumnKey,
            card.Text,
            card.CreatedAt);
    }
}
