using AgileRetro.WebApi.Data;
using AgileRetro.WebApi.Endpoint;
using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace AgileRetro.WebApi.Features.Session.CreateSession;

public sealed class CreatedSessionEndpoint : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("/sessions", Handle)
        .WithName("CreateSession")
        .WithTags("Sessions")
        .WithSummary("Create a retro session")
        .WithDescription(
            "Creates a session with a generated join code and registers the facilitator " +
            "as its first participant. Share the returned code so other participants " +
            "can join. Both names are required and limited to 100 characters.")
        .Accepts<CreateSessionRequest>("application/json")
        .Produces<CreateSessionResponse>(StatusCodes.Status200OK)
        .Produces<IDictionary<string, string[]>>(StatusCodes.Status400BadRequest);
    }
    public static async Task<Results<Ok<CreateSessionResponse>, BadRequest<IDictionary<string, string[]>>>> Handle(
     [FromBody] CreateSessionRequest request,
     IValidator<CreateSessionRequest> validator,
     AgileRetroDbContext dbContext,
     CancellationToken ct = default
    )
    {

        var result = await validator.ValidateAsync(request);

        if (!result.IsValid) return TypedResults.BadRequest(result.ToDictionary());

        var participant = new Entities.Participant
        {
            Name = request.ParticipantName
        };

        var session = new Entities.Session
        {
            Name = request.Name,
            Code = JoinCodeGenerator.Generate(),
            CreatedAt = DateTimeOffset.UtcNow,
            Participants = [participant]
        };

        await dbContext.AddAsync(session, ct);
        await dbContext.SaveChangesAsync(ct);

        return TypedResults.Ok(new CreateSessionResponse(session.Id, session.Name, session.Code, participant.Id, participant.Name));
    }
}

/// <summary>Request body for creating a session.</summary>
/// <param name="Name">Session name. Required, maximum 100 characters.</param>
/// <param name="ParticipantName">Facilitator display name. Required, maximum 100 characters.</param>
public record CreateSessionRequest(
    string Name,
    string ParticipantName
);

/// <summary>Session created by the request.</summary>
/// <param name="Id">Session id.</param>
/// <param name="Name">Session name.</param>
/// <param name="Code">Generated join code used by participants and the board route.</param>
/// <param name="ParticipantId">Id of the facilitator participant created with the session.</param>
/// <param name="ParticipantName">Facilitator display name.</param>
public record CreateSessionResponse(
    Guid Id,
    string Name,
    string Code,
    Guid ParticipantId,
    string ParticipantName
);