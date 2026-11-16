using AgileRetro.WebApi.Data;
using AgileRetro.WebApi.Endpoint;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace AgileRetro.WebApi.Features.Session.GetSession;

public sealed class GetSessionByCodeEndpoint : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("/sessions/by-code/{code}", Handle)
            .WithName("GetSessionByCode")
            .WithTags("Sessions")
            .WithSummary("Get a session by join code")
            .WithDescription(
                "Looks up a session by its generated join code. Returns the session id, " +
                "name, and code, or 404 when no session has that code.")
            .Produces<GetSessionResponse>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status404NotFound);
    }
    public async Task<Results<Ok<GetSessionResponse>, NotFound>> Handle(string code, AgileRetroDbContext dbContext, CancellationToken ct = default)
    {
        if (string.IsNullOrEmpty(code)) return TypedResults.NotFound();

        var session = await dbContext.Session.FirstOrDefaultAsync(s => s.Code.Equals(code), ct);

        if (session is null) return TypedResults.NotFound();

        return TypedResults.Ok(new GetSessionResponse(session.Id, session.Name, session.Code));
    }
}

/// <summary>Session lookup result.</summary>
/// <param name="Id">Session id.</param>
/// <param name="Name">Session name.</param>
/// <param name="Code">Join code used to open the session.</param>
public sealed record GetSessionResponse(
    Guid Id,
    string Name,
    string Code
);