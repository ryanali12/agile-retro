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

public record CreateSessionRequest(
    string Name,
    string ParticipantName
);

public record CreateSessionResponse(
    Guid Id,
    string Name,
    string Code,
    Guid ParticipantId,
    string ParticipantName
);