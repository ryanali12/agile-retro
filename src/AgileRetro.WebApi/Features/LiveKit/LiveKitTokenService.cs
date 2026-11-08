using System.Text;
using System.Text.Json;
using AgileRetro.WebApi.Features.Board;
using AgileRetro.WebApi.Features.LiveKit.GetLiveKitToken;
using Livekit.Server.Sdk.Dotnet;
using Microsoft.Extensions.Options;

namespace AgileRetro.WebApi.Features.LiveKit;

/// <summary>
/// Issues short-lived LiveKit access tokens for participants who are already
/// members of a retro session.
/// </summary>
public sealed class LiveKitTokenService(IOptions<LiveKitOptions> options)
{
    private readonly LiveKitOptions _options = options.Value;

    /// <summary>
    /// Creates a token scoped to the room that belongs to
    /// <paramref name="membership"/>.
    /// </summary>
    /// <remarks>
    /// The participant id is used as the LiveKit identity because it is unique
    /// within a session. A second connection with the same identity replaces
    /// the first one, which matches the product's one-voice-session-per-person
    /// behavior.
    /// </remarks>
    /// <exception cref="InvalidOperationException">
    /// Thrown when the API key, API secret, or token lifetime is not configured.
    /// </exception>
    public LiveKitTokenResponse CreateToken(BoardMembership membership)
    {
        if (string.IsNullOrWhiteSpace(_options.ApiKey) ||
            string.IsNullOrWhiteSpace(_options.ApiSecret))
        {
            throw new InvalidOperationException(
                "LiveKit is not configured. Set LiveKit:ApiKey and LiveKit:ApiSecret " +
                "with user secrets or the LiveKit__ApiKey and LiveKit__ApiSecret " +
                "environment variables.");
        }

        if (Encoding.UTF8.GetByteCount(_options.ApiSecret) < 32)
        {
            throw new InvalidOperationException(
                "LiveKit:ApiSecret must be at least 32 bytes (256 bits). Use the " +
                "secret from your LiveKit server or LiveKit Cloud.");
        }

        if (_options.TokenLifetime <= TimeSpan.Zero)
        {
            throw new InvalidOperationException(
                "LiveKit:TokenLifetime must be greater than zero.");
        }

        var roomName = RoomName(membership.SessionId);
        var expiresAt = DateTimeOffset.UtcNow.Add(_options.TokenLifetime);

        var token = new AccessToken(_options.ApiKey, _options.ApiSecret)
            .WithIdentity(membership.ParticipantId.ToString())
            .WithName(membership.ParticipantName)
            .WithMetadata(JsonSerializer.Serialize(new
            {
                participantId = membership.ParticipantId,
                sessionId = membership.SessionId,
            }))
            .WithExpiration(expiresAt)
            .WithGrants(new VideoGrants
            {
                Room = roomName,
                RoomJoin = true,
                CanPublish = true,
                CanSubscribe = true,
                CanPublishData = false,
                RoomAdmin = false,
            })
            .ToJwt();

        return new LiveKitTokenResponse(token, _options.Url, roomName, expiresAt);
    }

    /// <summary>
    /// Gets the LiveKit room name for a session. Deriving the name from the
    /// session id keeps it stable and avoids trusting client input.
    /// </summary>
    public static string RoomName(Guid sessionId) => $"session-{sessionId}";
}
