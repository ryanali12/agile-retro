using Microsoft.AspNetCore.SignalR;

namespace AgileRetro.WebApi.Hubs;

/// <summary>
/// Realtime channel for board updates. Client-callable methods and per-session
/// group membership are added with the first realtime feature.
/// </summary>
public sealed class BoardHub : Hub
{
}
