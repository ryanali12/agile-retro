using Microsoft.EntityFrameworkCore;

namespace AgileRetro.WebApi.Entities;

[Index(nameof(Code), IsUnique = true)]
public sealed class Session
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public required string Code { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public ICollection<Participant> Participants { get; set; } = [];
}