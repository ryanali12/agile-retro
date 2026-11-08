using System.Reflection;
using AgileRetro.WebApi.Data;
using AgileRetro.WebApi.Endpoint;
using AgileRetro.WebApi.Features.Board;
using AgileRetro.WebApi.Features.LiveKit;
using AgileRetro.WebApi.Hubs;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();
builder.Services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());
var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? [];

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        // An empty list means same-origin only (no CORS headers). Set
        // Cors:AllowedOrigins when the frontend is on another origin.
        if (allowedOrigins.Length == 0)
        {
            return;
        }

        policy
            .WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var connectionString = builder.Configuration.GetConnectionString("AgileRetro")
    ?? throw new InvalidOperationException(
        "Connection string 'AgileRetro' is not configured. Set it with: " +
        "dotnet user-secrets set \"ConnectionStrings:AgileRetro\" \"<connection string>\"");

builder.Services.AddDbContext<AgileRetroDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddSignalR();
builder.Services.AddScoped<BoardService>();
builder.Services.AddSingleton<BoardPresence>();
builder.Services.Configure<LiveKitOptions>(
    builder.Configuration.GetSection(LiveKitOptions.SectionName));
builder.Services.AddSingleton<LiveKitTokenService>();
builder.Services.AddEndpoints(typeof(Program).Assembly);

var app = builder.Build();

app.UseCors();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
else
{
    app.UseExceptionHandler();
    app.UseHttpsRedirection();
}

app.MapGet("/", () =>
{
    return "Hello";
});
app.MapEndpoints(app.MapGroup("api"));
app.MapHub<BoardHub>("/hubs/board");

app.Run();
