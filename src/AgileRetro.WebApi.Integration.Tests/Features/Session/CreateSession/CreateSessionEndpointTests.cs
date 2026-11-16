using System.Net;
using System.Net.Http.Json;
using AgileRetro.WebApi.Features.Session.CreateSession;
using AgileRetro.WebApi.Features.Session.GetSession;

namespace AgileRetro.WebApi.Integration.Tests.Features.Session.CreateSession;

[Collection("Integration Tests")]
public class CreateSessionEndpointTests(CustomWebApplicationFactory factory)
{
    private const int MaxNameLength = 100;

    private static readonly string TooLongName = new('a', MaxNameLength + 1);

    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task CreateSession_ReturnsSessionAndParticipant()
    {
        var request = new CreateSessionRequest("Sprint 42 retro", "Ada Lovelace");

        var response = await _client.PostAsJsonAsync("/api/sessions", request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var created = await response.Content.ReadFromJsonAsync<CreateSessionResponse>();

        Assert.NotNull(created);
        Assert.NotEqual(Guid.Empty, created.Id);
        Assert.Equal(request.Name, created.Name);
        Assert.NotEqual(Guid.Empty, created.ParticipantId);
        Assert.Equal(request.ParticipantName, created.ParticipantName);
        Assert.Equal(8, created.Code.Length);
        Assert.All(
            created.Code,
            character => Assert.Contains(character, "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"));
    }

    [Fact]
    public async Task CreateSession_PersistsSessionAndParticipant()
    {
        var created = await _client.CreateSessionAsync(
            name: "Persisted retro",
            participantName: "Grace Hopper");

        var sessionResponse = await _client.GetAsync($"/api/sessions/by-code/{created.Code}");

        Assert.Equal(HttpStatusCode.OK, sessionResponse.StatusCode);

        var session = await sessionResponse.Content.ReadFromJsonAsync<GetSessionResponse>();

        Assert.NotNull(session);
        Assert.Equal(created.Id, session.Id);
        Assert.Equal(created.Name, session.Name);
        Assert.Equal(created.Code, session.Code);

        var participantResponse = await _client.GetAsync(
            $"/api/sessions/{created.Code}/participants/{created.ParticipantId}");

        Assert.Equal(HttpStatusCode.OK, participantResponse.StatusCode);
    }

    [Fact]
    public async Task CreateSession_GeneratesUniqueCodes()
    {
        var first = await _client.CreateSessionAsync();
        var second = await _client.CreateSessionAsync();

        Assert.NotEqual(first.Code, second.Code);
    }

    [Theory]
    [InlineData("", "Participant")]
    [InlineData("   ", "Participant")]
    [InlineData("Retro", "")]
    [InlineData("Retro", "   ")]
    public async Task CreateSession_ReturnsBadRequest_WhenNameIsEmpty(
        string name,
        string participantName)
    {
        var response = await _client.PostAsJsonAsync(
            "/api/sessions",
            new CreateSessionRequest(name, participantName));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateSession_ReturnsBadRequest_WhenSessionNameIsTooLong()
    {
        var response = await _client.PostAsJsonAsync(
            "/api/sessions",
            new CreateSessionRequest(TooLongName, "Participant"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateSession_ReturnsBadRequest_WhenParticipantNameIsTooLong()
    {
        var response = await _client.PostAsJsonAsync(
            "/api/sessions",
            new CreateSessionRequest("Retro", TooLongName));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
