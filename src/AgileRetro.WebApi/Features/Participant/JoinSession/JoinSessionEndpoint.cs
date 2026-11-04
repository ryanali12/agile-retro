
using AgileRetro.WebApi.Data;
using AgileRetro.WebApi.Endpoint;
using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace AgileRetro.WebApi.Features.Participant.JoinSession;

public sealed class JoinSessionEndpoint : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {

        app.MapPost("/sessions/{code}/participants", Handle)
            .WithName("JoinSession")
            .Produces<JoinSessionResponse>(StatusCodes.Status200OK)
            .Produces<IDictionary<string, string[]>>(StatusCodes.Status400BadRequest)
            .Produces(StatusCodes.Status404NotFound);
    }

    public async Task<Results<Ok<JoinSessionResponse>, BadRequest<IDictionary<string, string[]>>, NotFound>> Handle(string code, JoinSessionRequest request, AgileRetroDbContext dbContext, IValidator<JoinSessionRequest> validator, CancellationToken ct = default)
    {
        var session = await dbContext.Session.FirstOrDefaultAsync(s => s.Code == code, ct);
        if (session is null) return TypedResults.NotFound();

        var result = await validator.ValidateAsync(request, ct);
        if (!result.IsValid) return TypedResults.BadRequest(result.ToDictionary());

        var participant = new Entities.Participant
        {
            Name = request.ParticipantName
        };
        session.Participants.Add(participant);

        await dbContext.SaveChangesAsync(ct);
        return TypedResults.Ok(new JoinSessionResponse(participant.Id, participant.Name));
    }


}
public record JoinSessionRequest(
    string ParticipantName
);

public record JoinSessionResponse(
    Guid ParticipantId,
    string ParticipantName
);
