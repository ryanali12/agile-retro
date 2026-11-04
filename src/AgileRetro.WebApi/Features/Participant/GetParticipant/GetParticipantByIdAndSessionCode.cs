using AgileRetro.WebApi.Data;
using AgileRetro.WebApi.Endpoint;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace AgileRetro.WebApi.Features.Participant.GetParticipant;

public sealed class GetParticipantByIdAndSessionCode : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet(
            "/sessions/{sessionCode}/participants/{participantId:guid}",
            Handle
        )
            .WithName("GetParticipant")
            .Produces<GetParticipantResponse>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status404NotFound);
    }

    public async Task<Results<Ok<GetParticipantResponse>, NotFound>> Handle(
        string sessionCode,
        Guid participantId,
        AgileRetroDbContext dbContext, CancellationToken ct = default)
    {
        if (string.IsNullOrEmpty(sessionCode))
            return TypedResults.NotFound();

        var participant = await dbContext.Participant
            .FirstOrDefaultAsync(p =>
                p.Id == participantId &&
                p.Session.Code == sessionCode, ct);

        if (participant is null)
            return TypedResults.NotFound();

        return TypedResults.Ok(new GetParticipantResponse(
            participant.Id,
            participant.Name
        ));
    }
}

public sealed record GetParticipantResponse(
    Guid Id,
    string Name
);