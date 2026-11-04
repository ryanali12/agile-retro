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

public sealed record GetSessionResponse(
    Guid Id,
    string Name,
    string Code
);