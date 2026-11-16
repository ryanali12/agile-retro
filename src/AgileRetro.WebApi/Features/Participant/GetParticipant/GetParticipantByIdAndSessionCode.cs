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
            .WithTags("Participants")
            .WithSummary("Get a participant")
            .WithDescription(
                "Returns a participant's id and display name when the participant belongs " +
                "to the session identified by the join code. Returns 404 when the session " +
                "or participant is unknown.")
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

/// <summary>Participant lookup result.</summary>
/// <param name="Id">Participant id.</param>
/// <param name="Name">Display name shown on the board.</param>
public sealed record GetParticipantResponse(
    Guid Id,
    string Name
);