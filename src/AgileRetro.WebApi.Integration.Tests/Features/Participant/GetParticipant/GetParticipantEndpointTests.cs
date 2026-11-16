using System.Net;
using System.Net.Http.Json;
using AgileRetro.WebApi.Features.Participant.GetParticipant;

namespace AgileRetro.WebApi.Integration.Tests.Features.Participant.GetParticipant;

[Collection("Integration Tests")]
public class GetParticipantEndpointTests(CustomWebApplicationFactory factory)
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task GetParticipant_ReturnsParticipant_WhenMemberOfSession()
    {
        var session = await _client.CreateSessionAsync();

        var response = await _client.GetAsync(
            $"/api/sessions/{session.Code}/participants/{session.ParticipantId}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var participant = await response.Content.ReadFromJsonAsync<GetParticipantResponse>();

        Assert.NotNull(participant);
        Assert.Equal(session.ParticipantId, participant.Id);
        Assert.Equal(session.ParticipantName, participant.Name);
    }

    [Fact]
    public async Task GetParticipant_ReturnsNotFound_WhenParticipantDoesNotExist()
    {
        var session = await _client.CreateSessionAsync();

        var response = await _client.GetAsync(
            $"/api/sessions/{session.Code}/participants/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetParticipant_ReturnsNotFound_WhenParticipantBelongsToAnotherSession()
    {
        var firstSession = await _client.CreateSessionAsync();
        var secondSession = await _client.CreateSessionAsync();

        var response = await _client.GetAsync(
            $"/api/sessions/{firstSession.Code}/participants/{secondSession.ParticipantId}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetParticipant_ReturnsNotFound_WhenSessionDoesNotExist()
    {
        var session = await _client.CreateSessionAsync();

        var response = await _client.GetAsync(
            $"/api/sessions/{Guid.NewGuid():N}/participants/{session.ParticipantId}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
