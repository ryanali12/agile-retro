namespace AgileRetro.WebApi.Features.LiveKit;

/// <summary>
/// Configuration for issuing LiveKit access tokens. Bind from the
/// <c>LiveKit</c> configuration section.
/// </summary>
/// <remarks>
/// Use user secrets locally and environment variables in containers. Never
/// place the API secret in <c>appsettings*.json</c> or send it to clients.
/// </remarks>
public sealed class LiveKitOptions
{
    /// <summary>The configuration section name.</summary>
    public const string SectionName = "LiveKit";

    /// <summary>LiveKit API key used to sign access tokens.</summary>
    public string ApiKey { get; set; } = string.Empty;

    /// <summary>LiveKit API secret used to sign access tokens. Keep this server-side only.</summary>
    public string ApiSecret { get; set; } = string.Empty;

    /// <summary>
    /// WebSocket URL clients use to connect, for example
    /// <c>wss://livekit.example.com</c>. Returned to the client with the token
    /// so the frontend does not need a separate build-time value.
    /// </summary>
    public string Url { get; set; } = string.Empty;

    /// <summary>
    /// How long an issued token remains valid. Defaults to one hour. Clients
    /// should request a new token before it expires.
    /// </summary>
    public TimeSpan TokenLifetime { get; set; } = TimeSpan.FromHours(1);
}
