using Microsoft.EntityFrameworkCore;

namespace AgileRetro.WebApi.Data;

public sealed class AgileRetroDbContext(DbContextOptions<AgileRetroDbContext> options)
    : DbContext(options)
{
}
