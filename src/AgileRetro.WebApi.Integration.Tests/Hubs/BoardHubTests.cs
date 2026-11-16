using AgileRetro.WebApi.Entities;
using AgileRetro.WebApi.Features.Board;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Client;

namespace AgileRetro.WebApi.Integration.Tests.Hubs;

[Collection("Integration Tests")]
public class BoardHubTests(CustomWebApplicationFactory factory)
{
    private const int MaxCardTextLength = 500;

    private static readonly string TooLongCardText = new('a', MaxCardTextLength + 1);

    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task JoinBoard_ReturnsSessionSnapshot()
    {
        var session = await _client.CreateSessionAsync(participantName: "Ada Lovelace");

        await using var connection = await factory.ConnectToBoardHubAsync();

        var snapshot = await connection.JoinBoardAsync(session.Code, session.ParticipantId);

        var participant = Assert.Single(snapshot.Participants);

        Assert.Multiple(
            () => Assert.Equal(session.Id, snapshot.SessionId),
            () => Assert.Equal(session.Code, snapshot.Code),
            () => Assert.Equal(session.Name, snapshot.Name),
            () => Assert.Empty(snapshot.Cards),
            () => Assert.Equal(session.ParticipantId, participant.ParticipantId),
            () => Assert.Equal("Ada Lovelace", participant.Name));
    }

    [Fact]
    public async Task JoinBoard_TrimsSessionCode()
    {
        var session = await _client.CreateSessionAsync();

        await using var connection = await factory.ConnectToBoardHubAsync();

        var snapshot = await connection.JoinBoardAsync(
            $"  {session.Code}  ",
            session.ParticipantId);

        Assert.Multiple(
            () => Assert.Equal(session.Id, snapshot.SessionId),
            () => Assert.Equal(session.Code, snapshot.Code));
    }

    [Fact]
    public async Task JoinBoard_NotifiesExistingParticipants()
    {
        var session = await _client.CreateSessionAsync(participantName: "Ada Lovelace");
        var joiner = await _client.JoinSessionAsync(session.Code, "Grace Hopper");

        await using var first = await factory.ConnectToBoardHubAsync();
        await first.JoinBoardAsync(session.Code, session.ParticipantId);

        var participantsChanged =
            first.EventChannel<List<BoardParticipantResponse>>("ParticipantsChanged");

        await using var second = await factory.ConnectToBoardHubAsync();
        await second.JoinBoardAsync(session.Code, joiner.ParticipantId);

        var participants = await participantsChanged.ReadEventAsync();

        Assert.Multiple(
            () => Assert.Equal(2, participants.Count),
            () => Assert.Contains(
                participants,
                participant =>
                    participant.ParticipantId == session.ParticipantId &&
                    participant.Name == "Ada Lovelace"),
            () => Assert.Contains(
                participants,
                participant =>
                    participant.ParticipantId == joiner.ParticipantId &&
                    participant.Name == "Grace Hopper"));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public async Task JoinBoard_Throws_WhenCodeIsEmpty(string? code)
    {
        var session = await _client.CreateSessionAsync();

        await using var connection = await factory.ConnectToBoardHubAsync();

        var exception = await Assert.ThrowsAsync<HubException>(
            () => connection.JoinBoardAsync(code, session.ParticipantId));

        Assert.EndsWith("HubException: Session code is required.", exception.Message);
    }

    [Fact]
    public async Task JoinBoard_Throws_WhenSessionDoesNotExist()
    {
        var session = await _client.CreateSessionAsync();

        await using var connection = await factory.ConnectToBoardHubAsync();

        var exception = await Assert.ThrowsAsync<HubException>(
            () => connection.JoinBoardAsync(Guid.NewGuid().ToString("N"), session.ParticipantId));

        Assert.EndsWith("HubException: Session or participant not found.", exception.Message);
    }

    [Fact]
    public async Task JoinBoard_Throws_WhenParticipantDoesNotExist()
    {
        var session = await _client.CreateSessionAsync();

        await using var connection = await factory.ConnectToBoardHubAsync();

        var exception = await Assert.ThrowsAsync<HubException>(
            () => connection.JoinBoardAsync(session.Code, Guid.NewGuid()));

        Assert.EndsWith("HubException: Session or participant not found.", exception.Message);
    }

    [Fact]
    public async Task JoinBoard_Throws_WhenParticipantBelongsToAnotherSession()
    {
        var firstSession = await _client.CreateSessionAsync(participantName: "Ada Lovelace");
        var secondSession = await _client.CreateSessionAsync(participantName: "Grace Hopper");

        await using var connection = await factory.ConnectToBoardHubAsync();

        var exception = await Assert.ThrowsAsync<HubException>(
            () => connection.JoinBoardAsync(firstSession.Code, secondSession.ParticipantId));

        Assert.EndsWith("HubException: Session or participant not found.", exception.Message);
    }

    [Fact]
    public async Task StopConnection_NotifiesRemainingParticipants()
    {
        var session = await _client.CreateSessionAsync(participantName: "Ada Lovelace");
        var leaver = await _client.JoinSessionAsync(session.Code, "Grace Hopper");

        await using var observer = await ConnectJoinedAsync(session.Code, session.ParticipantId);

        var participantsChanged =
            observer.EventChannel<List<BoardParticipantResponse>>("ParticipantsChanged");

        await using var departing = await factory.ConnectToBoardHubAsync();
        await departing.JoinBoardAsync(session.Code, leaver.ParticipantId);

        var afterJoin = await participantsChanged.ReadEventAsync();
        Assert.Equal(2, afterJoin.Count);

        await departing.StopAsync().WaitAsync(BoardHubTestExtensions.DefaultTimeout);

        var afterLeave = await participantsChanged.ReadEventAsync();

        var remaining = Assert.Single(afterLeave);

        Assert.Multiple(
            () => Assert.Equal(session.ParticipantId, remaining.ParticipantId),
            () => Assert.Equal("Ada Lovelace", remaining.Name));
    }

    [Fact]
    public async Task CreateCard_PersistsCardAndReturnsIt()
    {
        var session = await _client.CreateSessionAsync(participantName: "Ada Lovelace");

        await using var connection = await ConnectJoinedAsync(
            session.Code,
            session.ParticipantId);

        var before = DateTimeOffset.UtcNow;
        var card = await connection.CreateCardAsync(
            BoardColumns.WentWell,
            "  Pairing all week  ");
        var after = DateTimeOffset.UtcNow;

        Assert.Multiple(
            () => Assert.NotEqual(Guid.Empty, card.Id),
            () => Assert.Equal(session.ParticipantId, card.ParticipantId),
            () => Assert.Equal("Ada Lovelace", card.AuthorName),
            () => Assert.Equal(BoardColumns.WentWell, card.ColumnKey),
            () => Assert.Equal("Pairing all week", card.Text),
            () => Assert.InRange(card.CreatedAt, before, after));

        await using var second = await factory.ConnectToBoardHubAsync();
        var snapshot = await second.JoinBoardAsync(session.Code, session.ParticipantId);
        var persisted = Assert.Single(snapshot.Cards);

        Assert.Multiple(
            () => Assert.Equal(card.Id, persisted.Id),
            () => Assert.Equal(card.ParticipantId, persisted.ParticipantId),
            () => Assert.Equal(card.ColumnKey, persisted.ColumnKey),
            () => Assert.Equal(card.Text, persisted.Text));
    }

    [Fact]
    public async Task CreateCard_BroadcastsToOtherParticipants()
    {
        var session = await _client.CreateSessionAsync(participantName: "Ada Lovelace");
        var observerParticipant = await _client.JoinSessionAsync(session.Code, "Grace Hopper");

        await using var author = await ConnectJoinedAsync(
            session.Code,
            session.ParticipantId);
        await using var observer = await ConnectJoinedAsync(
            session.Code,
            observerParticipant.ParticipantId);

        var cardCreated = observer.EventChannel<BoardCardResponse>("CardCreated");

        var card = await author.CreateCardAsync(
            BoardColumns.NeedsImprovement,
            "Reduce build time");

        var broadcast = await cardCreated.ReadEventAsync();

        Assert.Multiple(
            () => Assert.Equal(card.Id, broadcast.Id),
            () => Assert.Equal(session.ParticipantId, broadcast.ParticipantId),
            () => Assert.Equal("Ada Lovelace", broadcast.AuthorName),
            () => Assert.Equal(BoardColumns.NeedsImprovement, broadcast.ColumnKey),
            () => Assert.Equal("Reduce build time", broadcast.Text));
    }

    [Fact]
    public async Task CreateCard_Throws_WhenConnectionHasNotJoinedBoard()
    {
        await using var connection = await factory.ConnectToBoardHubAsync();

        var exception = await Assert.ThrowsAsync<HubException>(
            () => connection.CreateCardAsync(BoardColumns.WentWell, "Text"));

        Assert.EndsWith("HubException: Join the board before adding cards.", exception.Message);
    }

    [Fact]
    public async Task CreateCard_Throws_WhenRequestIsNull()
    {
        var session = await _client.CreateSessionAsync();

        await using var connection = await ConnectJoinedAsync(
            session.Code,
            session.ParticipantId);

        var exception = await Assert.ThrowsAsync<HubException>(
            () => connection
                .InvokeAsync<BoardCardResponse>("CreateCard", (object?)null)
                .WaitAsync(BoardHubTestExtensions.DefaultTimeout));

        Assert.EndsWith("HubException: Choose a card column and write some text.", exception.Message);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("not-a-column")]
    public async Task CreateCard_Throws_WhenColumnIsInvalid(string? columnKey)
    {
        var session = await _client.CreateSessionAsync();

        await using var connection = await ConnectJoinedAsync(
            session.Code,
            session.ParticipantId);

        var exception = await Assert.ThrowsAsync<HubException>(
            () => connection.CreateCardAsync(columnKey, "Text"));

        Assert.EndsWith("HubException: Choose a valid column.", exception.Message);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public async Task CreateCard_Throws_WhenTextIsEmpty(string? text)
    {
        var session = await _client.CreateSessionAsync();

        await using var connection = await ConnectJoinedAsync(
            session.Code,
            session.ParticipantId);

        var exception = await Assert.ThrowsAsync<HubException>(
            () => connection.CreateCardAsync(BoardColumns.WentWell, text));

        Assert.EndsWith("HubException: Write a card before saving it.", exception.Message);
    }

    [Fact]
    public async Task CreateCard_Throws_WhenTextIsTooLong()
    {
        var session = await _client.CreateSessionAsync();

        await using var connection = await ConnectJoinedAsync(
            session.Code,
            session.ParticipantId);

        var exception = await Assert.ThrowsAsync<HubException>(
            () => connection.CreateCardAsync(BoardColumns.WentWell, TooLongCardText));

        Assert.EndsWith("HubException: Keep cards under 500 characters.", exception.Message);
    }

    [Fact]
    public async Task UpdateCard_UpdatesOwnCardAndBroadcasts()
    {
        var session = await _client.CreateSessionAsync(participantName: "Ada Lovelace");
        var observerParticipant = await _client.JoinSessionAsync(session.Code, "Grace Hopper");

        await using var author = await ConnectJoinedAsync(
            session.Code,
            session.ParticipantId);
        var card = await author.CreateCardAsync(BoardColumns.WentWell, "Original text");

        await using var observer = await ConnectJoinedAsync(
            session.Code,
            observerParticipant.ParticipantId);
        var cardUpdated = observer.EventChannel<BoardCardResponse>("CardUpdated");

        var updated = await author.UpdateCardAsync(card.Id, "  Revised text  ");
        var broadcast = await cardUpdated.ReadEventAsync();

        Assert.Multiple(
            () => Assert.Equal(card.Id, updated.Id),
            () => Assert.Equal(session.ParticipantId, updated.ParticipantId),
            () => Assert.Equal("Ada Lovelace", updated.AuthorName),
            () => Assert.Equal(card.ColumnKey, updated.ColumnKey),
            () => Assert.InRange(
                updated.CreatedAt,
                card.CreatedAt.AddTicks(-10),
                card.CreatedAt.AddTicks(10)),
            () => Assert.Equal("Revised text", updated.Text),
            () => Assert.Equal(card.Id, broadcast.Id),
            () => Assert.Equal("Revised text", broadcast.Text));
    }

    [Fact]
    public async Task UpdateCard_Throws_WhenConnectionHasNotJoinedBoard()
    {
        await using var connection = await factory.ConnectToBoardHubAsync();

        var exception = await Assert.ThrowsAsync<HubException>(
            () => connection.UpdateCardAsync(Guid.NewGuid(), "Text"));

        Assert.EndsWith("HubException: Join the board before editing cards.", exception.Message);
    }

    [Fact]
    public async Task UpdateCard_Throws_WhenRequestIsNull()
    {
        var session = await _client.CreateSessionAsync();

        await using var connection = await ConnectJoinedAsync(
            session.Code,
            session.ParticipantId);

        var exception = await Assert.ThrowsAsync<HubException>(
            () => connection
                .InvokeAsync<BoardCardResponse>("UpdateCard", (object?)null)
                .WaitAsync(BoardHubTestExtensions.DefaultTimeout));

        Assert.EndsWith("HubException: Choose a card and write some text.", exception.Message);
    }

    [Fact]
    public async Task UpdateCard_Throws_WhenCardIdIsEmpty()
    {
        var session = await _client.CreateSessionAsync();

        await using var connection = await ConnectJoinedAsync(
            session.Code,
            session.ParticipantId);

        var exception = await Assert.ThrowsAsync<HubException>(
            () => connection.UpdateCardAsync(Guid.Empty, "Text"));

        Assert.EndsWith("HubException: Choose a card to edit.", exception.Message);
    }

    [Fact]
    public async Task UpdateCard_Throws_WhenCardDoesNotExist()
    {
        var session = await _client.CreateSessionAsync();

        await using var connection = await ConnectJoinedAsync(
            session.Code,
            session.ParticipantId);

        var exception = await Assert.ThrowsAsync<HubException>(
            () => connection.UpdateCardAsync(Guid.NewGuid(), "Text"));

        Assert.EndsWith("HubException: Card not found or you cannot edit it.", exception.Message);
    }

    [Fact]
    public async Task UpdateCard_Throws_WhenParticipantIsNotTheAuthor()
    {
        var session = await _client.CreateSessionAsync(participantName: "Ada Lovelace");
        var otherParticipant = await _client.JoinSessionAsync(session.Code, "Grace Hopper");

        await using var author = await ConnectJoinedAsync(
            session.Code,
            session.ParticipantId);
        var card = await author.CreateCardAsync(BoardColumns.WentWell, "Original text");

        await using var other = await ConnectJoinedAsync(
            session.Code,
            otherParticipant.ParticipantId);

        var exception = await Assert.ThrowsAsync<HubException>(
            () => other.UpdateCardAsync(card.Id, "Hijacked text"));

        Assert.EndsWith("HubException: Card not found or you cannot edit it.", exception.Message);
    }

    [Fact]
    public async Task UpdateCard_Throws_WhenCardBelongsToAnotherSession()
    {
        var firstSession = await _client.CreateSessionAsync(participantName: "Ada Lovelace");
        var secondSession = await _client.CreateSessionAsync(participantName: "Grace Hopper");

        await using var author = await ConnectJoinedAsync(
            firstSession.Code,
            firstSession.ParticipantId);
        var card = await author.CreateCardAsync(BoardColumns.WentWell, "Original text");

        await using var outsider = await ConnectJoinedAsync(
            secondSession.Code,
            secondSession.ParticipantId);

        var exception = await Assert.ThrowsAsync<HubException>(
            () => outsider.UpdateCardAsync(card.Id, "Hijacked text"));

        Assert.EndsWith("HubException: Card not found or you cannot edit it.", exception.Message);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public async Task UpdateCard_Throws_WhenTextIsEmpty(string? text)
    {
        var session = await _client.CreateSessionAsync();

        await using var connection = await ConnectJoinedAsync(
            session.Code,
            session.ParticipantId);

        var exception = await Assert.ThrowsAsync<HubException>(
            () => connection.UpdateCardAsync(Guid.NewGuid(), text));

        Assert.EndsWith("HubException: Write a card before saving it.", exception.Message);
    }

    [Fact]
    public async Task UpdateCard_Throws_WhenTextIsTooLong()
    {
        var session = await _client.CreateSessionAsync();

        await using var connection = await ConnectJoinedAsync(
            session.Code,
            session.ParticipantId);

        var exception = await Assert.ThrowsAsync<HubException>(
            () => connection.UpdateCardAsync(Guid.NewGuid(), TooLongCardText));

        Assert.EndsWith("HubException: Keep cards under 500 characters.", exception.Message);
    }

    [Fact]
    public async Task DeleteCard_DeletesOwnCardAndBroadcasts()
    {
        var session = await _client.CreateSessionAsync(participantName: "Ada Lovelace");
        var observerParticipant = await _client.JoinSessionAsync(session.Code, "Grace Hopper");

        await using var author = await ConnectJoinedAsync(
            session.Code,
            session.ParticipantId);
        var card = await author.CreateCardAsync(BoardColumns.ActionItems, "Book a follow-up");

        await using var observer = await ConnectJoinedAsync(
            session.Code,
            observerParticipant.ParticipantId);
        var cardDeleted = observer.EventChannel<Guid>("CardDeleted");

        var deletedCardId = await author.DeleteCardAsync(card.Id);
        var broadcast = await cardDeleted.ReadEventAsync();

        Assert.Multiple(
            () => Assert.Equal(card.Id, deletedCardId),
            () => Assert.Equal(card.Id, broadcast));

        await using var verifier = await factory.ConnectToBoardHubAsync();
        var snapshot = await verifier.JoinBoardAsync(session.Code, session.ParticipantId);

        Assert.Empty(snapshot.Cards);
    }

    [Fact]
    public async Task DeleteCard_Throws_WhenConnectionHasNotJoinedBoard()
    {
        await using var connection = await factory.ConnectToBoardHubAsync();

        var exception = await Assert.ThrowsAsync<HubException>(
            () => connection.DeleteCardAsync(Guid.NewGuid()));

        Assert.EndsWith("HubException: Join the board before deleting cards.", exception.Message);
    }

    [Fact]
    public async Task DeleteCard_Throws_WhenRequestIsNull()
    {
        var session = await _client.CreateSessionAsync();

        await using var connection = await ConnectJoinedAsync(
            session.Code,
            session.ParticipantId);

        var exception = await Assert.ThrowsAsync<HubException>(
            () => connection
                .InvokeAsync<Guid>("DeleteCard", (object?)null)
                .WaitAsync(BoardHubTestExtensions.DefaultTimeout));

        Assert.EndsWith("HubException: Choose a card to delete.", exception.Message);
    }

    [Fact]
    public async Task DeleteCard_Throws_WhenCardIdIsEmpty()
    {
        var session = await _client.CreateSessionAsync();

        await using var connection = await ConnectJoinedAsync(
            session.Code,
            session.ParticipantId);

        var exception = await Assert.ThrowsAsync<HubException>(
            () => connection.DeleteCardAsync(Guid.Empty));

        Assert.EndsWith("HubException: Choose a card to delete.", exception.Message);
    }

    [Fact]
    public async Task DeleteCard_Throws_WhenCardDoesNotExist()
    {
        var session = await _client.CreateSessionAsync();

        await using var connection = await ConnectJoinedAsync(
            session.Code,
            session.ParticipantId);

        var exception = await Assert.ThrowsAsync<HubException>(
            () => connection.DeleteCardAsync(Guid.NewGuid()));

        Assert.EndsWith("HubException: Card not found or you cannot delete it.", exception.Message);
    }

    [Fact]
    public async Task DeleteCard_Throws_WhenParticipantIsNotTheAuthor()
    {
        var session = await _client.CreateSessionAsync(participantName: "Ada Lovelace");
        var otherParticipant = await _client.JoinSessionAsync(session.Code, "Grace Hopper");

        await using var author = await ConnectJoinedAsync(
            session.Code,
            session.ParticipantId);
        var card = await author.CreateCardAsync(BoardColumns.ActionItems, "Book a follow-up");

        await using var other = await ConnectJoinedAsync(
            session.Code,
            otherParticipant.ParticipantId);

        var exception = await Assert.ThrowsAsync<HubException>(
            () => other.DeleteCardAsync(card.Id));

        Assert.EndsWith("HubException: Card not found or you cannot delete it.", exception.Message);
    }

    [Fact]
    public async Task DeleteCard_Throws_WhenCardBelongsToAnotherSession()
    {
        var firstSession = await _client.CreateSessionAsync(participantName: "Ada Lovelace");
        var secondSession = await _client.CreateSessionAsync(participantName: "Grace Hopper");

        await using var author = await ConnectJoinedAsync(
            firstSession.Code,
            firstSession.ParticipantId);
        var card = await author.CreateCardAsync(BoardColumns.ActionItems, "Book a follow-up");

        await using var outsider = await ConnectJoinedAsync(
            secondSession.Code,
            secondSession.ParticipantId);

        var exception = await Assert.ThrowsAsync<HubException>(
            () => outsider.DeleteCardAsync(card.Id));

        Assert.EndsWith("HubException: Card not found or you cannot delete it.", exception.Message);
    }

    private async Task<HubConnection> ConnectJoinedAsync(string code, Guid participantId)
    {
        var connection = await factory.ConnectToBoardHubAsync();
        await connection.JoinBoardAsync(code, participantId);

        return connection;
    }
}
