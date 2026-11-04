using AgileRetro.WebApi.Entities;
using Microsoft.EntityFrameworkCore;

namespace AgileRetro.WebApi.Data;

public sealed class AgileRetroDbContext(DbContextOptions<AgileRetroDbContext> options)
    : DbContext(options)
{
    public DbSet<Session> Session { get; set; }

    public DbSet<Participant> Participant { get; set; }

    public DbSet<BoardCard> BoardCard { get; set; }
}
