using AgileRetro.WebApi.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Testcontainers.PostgreSql;

namespace AgileRetro.WebApi.Integration.Tests;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    public const string LiveKitApiKey = "integration-test-api-key";
    public const string LiveKitApiSecret = "integration-test-livekit-secret-0123456789abcdef";
    public const string LiveKitUrl = "wss://livekit.test";

    private readonly PostgreSqlContainer _dbContainer = new PostgreSqlBuilder("postgres:17-alpine")
        .WithDatabase("testdb")
        .WithUsername("testuser")
        .WithPassword("p@ssword12345")
        .Build();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration((_, configuration) =>
        {
            configuration.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:AgileRetro"] = "Host=localhost;Database=agile_retro_tests;Username=tests;Password=tests",
                ["LiveKit:ApiKey"] = LiveKitApiKey,
                ["LiveKit:ApiSecret"] = LiveKitApiSecret,
                ["LiveKit:Url"] = LiveKitUrl,
                ["LiveKit:TokenLifetime"] = "01:00:00",
            });
        });

        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<AgileRetroDbContext>>();

            services.AddDbContext<AgileRetroDbContext>(options =>
                options.UseNpgsql(_dbContainer.GetConnectionString()));
        });
    }

    public async Task InitializeAsync()
    {
        await _dbContainer.StartAsync();

        using var scope = Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AgileRetroDbContext>();
        await dbContext.Database.MigrateAsync();
    }

    public new async Task DisposeAsync()
    {
        await _dbContainer.DisposeAsync();
        await base.DisposeAsync();
    }
}
