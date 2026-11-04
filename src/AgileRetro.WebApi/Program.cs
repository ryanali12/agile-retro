using System.Reflection;
using AgileRetro.WebApi.Data;
using AgileRetro.WebApi.Endpoint;
using AgileRetro.WebApi.Features.Board;
using AgileRetro.WebApi.Hubs;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();
builder.Services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()   // Allows requests from any frontend URL
              .AllowAnyHeader()   // Allows any request headers
              .AllowAnyMethod();  // Allows GET, POST, PUT, DELETE, etc.
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

app.MapEndpoints(app.MapGroup("api"));
app.MapHub<BoardHub>("/hubs/board");

app.Run();
