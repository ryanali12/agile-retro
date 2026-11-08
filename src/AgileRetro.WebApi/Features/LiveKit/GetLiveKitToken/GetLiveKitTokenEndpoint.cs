using AgileRetro.WebApi.Endpoint;
using AgileRetro.WebApi.Features.Board;
using Microsoft.AspNetCore.Http.HttpResults;

namespace AgileRetro.WebApi.Features.LiveKit.GetLiveKitToken;

/// <summary>
/// Issues a LiveKit access token for a participant in a retro session.
/// </summary>
/// <remarks>
/// Token issuance is an HTTP concern rather than a hub method so tokens can be
/// refreshed independently of the SignalR connection and reused by other
/// clients. The same membership lookup used by <c>JoinBoard</c> authorizes the
/// request; a participant cannot obtain a token for a session they have not
/// joined.
/// </remarks>
public sealed class GetLiveKitTokenEndpoint : IEndpoint
{
    /// <inheritdoc />
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("/sessions/{code}/livekit-token", Handle)
            .WithName("GetLiveKitToken")
            .WithTags("LiveKit")
            .WithSummary("Issue a LiveKit access token")
            .WithDescription(
                "Returns a short-lived LiveKit token for a participant in the session. " +
                "The token is scoped to the session's room and allows the participant to " +
                "publish and subscribe to audio and video. Call this endpoint again before " +
                "ExpiresAt to refresh the token.")
            .Accepts<GetLiveKitTokenRequest>("application/json")
            .Produces<LiveKitTokenResponse>(StatusCodes.Status200OK)
            .Produces(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status503ServiceUnavailable);
    }

    private static async Task<Results<Ok<LiveKitTokenResponse>, NotFound, ProblemHttpResult>> Handle(
        string code,
        GetLiveKitTokenRequest request,
        BoardService boardService,
        LiveKitTokenService tokenService,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(code) || request.ParticipantId == Guid.Empty)
        {
            return TypedResults.NotFound();
        }

        var membership = await boardService.FindMembershipAsync(
            code,
            request.ParticipantId,
            ct);

        if (membership is null)
        {
            return TypedResults.NotFound();
        }

        try
        {
            return TypedResults.Ok(tokenService.CreateToken(membership));
        }
        catch (InvalidOperationException ex)
        {
            return TypedResults.Problem(
                title: "LiveKit is unavailable",
                detail: ex.Message,
                statusCode: StatusCodes.Status503ServiceUnavailable);
        }
    }
}

/// <summary>
/// Request body for issuing a LiveKit token. The participant id is the
/// identity returned when the participant joined the session; it is validated
/// against the session before a token is created.
/// </summary>
/// <param name="ParticipantId">The participant id stored by the client after joining the session.</param>
public sealed record GetLiveKitTokenRequest(Guid ParticipantId);

/// <summary>
/// A LiveKit access token and the connection details the client needs to join
/// the session's room.
/// </summary>
/// <param name="Token">Signed LiveKit access token for this participant.</param>
/// <param name="Url">LiveKit WebSocket URL to connect to.</param>
/// <param name="RoomName">LiveKit room that represents the retro session.</param>
/// <param name="ExpiresAt">UTC time when the token expires; request a new one before this instant.</param>
public sealed record LiveKitTokenResponse(
    string Token,
    string Url,
    string RoomName,
    DateTimeOffset ExpiresAt);
