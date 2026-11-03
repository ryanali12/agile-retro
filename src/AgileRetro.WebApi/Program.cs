using AgileRetro.WebApi.Data;
using AgileRetro.WebApi.Endpoint;
using AgileRetro.WebApi.Hubs;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();

var connectionString = builder.Configuration.GetConnectionString("AgileRetro")
    ?? throw new InvalidOperationException(
        "Connection string 'AgileRetro' is not configured. Set it with: " +
        "dotnet user-secrets set \"ConnectionStrings:AgileRetro\" \"<connection string>\"");

builder.Services.AddDbContext<AgileRetroDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddSignalR();
builder.Services.AddEndpoints(typeof(Program).Assembly);

var app = builder.Build();

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
