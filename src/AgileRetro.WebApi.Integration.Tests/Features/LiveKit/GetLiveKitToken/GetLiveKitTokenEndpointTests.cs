using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using AgileRetro.WebApi.Features.LiveKit;
using AgileRetro.WebApi.Features.LiveKit.GetLiveKitToken;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.DependencyInjection;

namespace AgileRetro.WebApi.Integration.Tests.Features.LiveKit.GetLiveKitToken;

[Collection("Integration Tests")]
public class GetLiveKitTokenEndpointTests(CustomWebApplicationFactory factory)
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task GetLiveKitToken_ReturnsTokenForSessionMember()
    {
        var session = await _client.CreateSessionAsync();
        var before = DateTimeOffset.UtcNow;

        var response = await _client.PostAsJsonAsync(
            $"/api/sessions/{session.Code}/livekit-token",
            new GetLiveKitTokenRequest(session.ParticipantId));
        var after = DateTimeOffset.UtcNow;

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var token = await response.Content.ReadFromJsonAsync<LiveKitTokenResponse>();

        Assert.NotNull(token);
        Assert.False(string.IsNullOrWhiteSpace(token.Token));
        Assert.Equal(3, token.Token.Split('.').Length);
        Assert.Equal(CustomWebApplicationFactory.LiveKitUrl, token.Url);
        Assert.Equal($"session-{session.Id}", token.RoomName);
        Assert.InRange(token.ExpiresAt, before.AddMinutes(55), after.AddMinutes(65));
    }

    [Fact]
    public async Task GetLiveKitToken_ScopesTokenToSessionAndParticipant()
    {
        var session = await _client.CreateSessionAsync();

        var response = await _client.PostAsJsonAsync(
            $"/api/sessions/{session.Code}/livekit-token",
            new GetLiveKitTokenRequest(session.ParticipantId));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var token = await response.Content.ReadFromJsonAsync<LiveKitTokenResponse>();

        Assert.NotNull(token);

        using var payload = DecodeJwtPayload(token.Token);
        var payloadJson = payload.RootElement.GetRawText();

        Assert.True(payload.RootElement.TryGetProperty("sub", out var subject), payloadJson);
        Assert.Equal(session.ParticipantId.ToString(), subject.GetString());

        Assert.True(payload.RootElement.TryGetProperty("video", out var video), payloadJson);
        Assert.True(video.TryGetProperty("room", out var room), payloadJson);
        Assert.Equal($"session-{session.Id}", room.GetString());

        Assert.True(video.TryGetProperty("roomJoin", out var roomJoin), payloadJson);
        Assert.True(roomJoin.GetBoolean());
        Assert.True(video.TryGetProperty("canPublish", out var canPublish), payloadJson);
        Assert.True(canPublish.GetBoolean());
        Assert.True(video.TryGetProperty("canSubscribe", out var canSubscribe), payloadJson);
        Assert.True(canSubscribe.GetBoolean());
        Assert.True(video.TryGetProperty("canPublishData", out var canPublishData), payloadJson);
        Assert.False(canPublishData.GetBoolean());
        Assert.True(video.TryGetProperty("roomAdmin", out var roomAdmin), payloadJson);
        Assert.False(roomAdmin.GetBoolean());
    }

    [Fact]
    public async Task GetLiveKitToken_ReturnsNotFound_WhenSessionDoesNotExist()
    {
        var response = await _client.PostAsJsonAsync(
            $"/api/sessions/{Guid.NewGuid():N}/livekit-token",
            new GetLiveKitTokenRequest(Guid.NewGuid()));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetLiveKitToken_ReturnsNotFound_WhenParticipantDoesNotExist()
    {
        var session = await _client.CreateSessionAsync();

        var response = await _client.PostAsJsonAsync(
            $"/api/sessions/{session.Code}/livekit-token",
            new GetLiveKitTokenRequest(Guid.NewGuid()));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetLiveKitToken_ReturnsNotFound_WhenParticipantBelongsToAnotherSession()
    {
        var firstSession = await _client.CreateSessionAsync();
        var secondSession = await _client.CreateSessionAsync();

        var response = await _client.PostAsJsonAsync(
            $"/api/sessions/{firstSession.Code}/livekit-token",
            new GetLiveKitTokenRequest(secondSession.ParticipantId));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetLiveKitToken_ReturnsNotFound_WhenParticipantIdIsEmpty()
    {
        var session = await _client.CreateSessionAsync();

        var response = await _client.PostAsJsonAsync(
            $"/api/sessions/{session.Code}/livekit-token",
            new GetLiveKitTokenRequest(Guid.Empty));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetLiveKitToken_ReturnsServiceUnavailable_WhenLiveKitIsNotConfigured()
    {
        using var unconfiguredFactory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                services.PostConfigure<LiveKitOptions>(options =>
                {
                    options.ApiKey = string.Empty;
                    options.ApiSecret = string.Empty;
                });
            });
        });

        using var client = unconfiguredFactory.CreateClient();
        var session = await _client.CreateSessionAsync();

        var response = await client.PostAsJsonAsync(
            $"/api/sessions/{session.Code}/livekit-token",
            new GetLiveKitTokenRequest(session.ParticipantId));

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);

        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>();

        Assert.NotNull(problem);
        Assert.Equal("LiveKit is unavailable", problem.Title);
        Assert.Equal((int)HttpStatusCode.ServiceUnavailable, problem.Status);
    }

    [Fact]
    public async Task GetLiveKitToken_ReturnsServiceUnavailable_WhenSecretIsTooShort()
    {
        using var misconfiguredFactory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                services.PostConfigure<LiveKitOptions>(options =>
                    options.ApiSecret = "too-short");
            });
        });

        using var client = misconfiguredFactory.CreateClient();
        var session = await _client.CreateSessionAsync();

        var response = await client.PostAsJsonAsync(
            $"/api/sessions/{session.Code}/livekit-token",
            new GetLiveKitTokenRequest(session.ParticipantId));

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
    }

    [Fact]
    public async Task GetLiveKitToken_ReturnsServiceUnavailable_WhenTokenLifetimeIsNotPositive()
    {
        using var misconfiguredFactory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                services.PostConfigure<LiveKitOptions>(options =>
                    options.TokenLifetime = TimeSpan.Zero);
            });
        });

        using var client = misconfiguredFactory.CreateClient();
        var session = await _client.CreateSessionAsync();

        var response = await client.PostAsJsonAsync(
            $"/api/sessions/{session.Code}/livekit-token",
            new GetLiveKitTokenRequest(session.ParticipantId));

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
    }

    private static JsonDocument DecodeJwtPayload(string token)
    {
        var payload = token.Split('.')[1];
        var json = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(payload));

        return JsonDocument.Parse(json);
    }
}
