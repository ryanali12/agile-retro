namespace AgileRetro.WebApi.Entities;

public sealed class Participant
{
    public Guid Id { get; set; }
    public required string Name { get; set; }

    public Session Session { get; set; } = null!;

    public Guid SessionId { get; set; }
}