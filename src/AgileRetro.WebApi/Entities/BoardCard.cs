namespace AgileRetro.WebApi.Entities;

public static class BoardColumns
{
    public const string WentWell = "went-well";
    public const string DidntGoWell = "didnt-go-well";
    public const string NeedsImprovement = "needs-improvement";
    public const string ActionItems = "action-items";

    public static readonly string[] All =
    [
        WentWell, DidntGoWell, NeedsImprovement, ActionItems
    ];

    public static bool IsValid(string key) => All.Contains(key);
}

public sealed class BoardCard
{
    public Guid Id { get; set; }
    public Guid SessionId { get; set; }
    public Guid ParticipantId { get; set; }
    public required string ColumnKey { get; set; }
    public required string Text { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}