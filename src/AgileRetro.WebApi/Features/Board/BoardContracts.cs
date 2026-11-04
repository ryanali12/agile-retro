namespace AgileRetro.WebApi.Features.Board;

public sealed record BoardSnapshot(
    Guid SessionId,
    string Code,
    string Name,
    IReadOnlyList<BoardCardResponse> Cards,
    IReadOnlyList<BoardParticipantResponse> Participants);

public sealed record BoardCardResponse(
    Guid Id,
    Guid ParticipantId,
    string AuthorName,
    string ColumnKey,
    string Text,
    DateTimeOffset CreatedAt);

public sealed record BoardParticipantResponse(
    Guid ParticipantId,
    string Name);

public sealed record CreateBoardCardRequest(
    string? ColumnKey,
    string? Text);

public sealed record UpdateBoardCardRequest(
    Guid CardId,
    string? Text);

public sealed record DeleteBoardCardRequest(
    Guid CardId
);

public sealed record BoardMembership(
    Guid SessionId,
    string Code,
    string Name,
    Guid ParticipantId,
    string ParticipantName);
