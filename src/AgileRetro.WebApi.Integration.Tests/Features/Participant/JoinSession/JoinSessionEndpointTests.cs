using System.Net;
using System.Net.Http.Json;
using AgileRetro.WebApi.Features.Participant.GetParticipant;
using AgileRetro.WebApi.Features.Participant.JoinSession;

namespace AgileRetro.WebApi.Integration.Tests.Features.Participant.JoinSession;

[Collection("Integration Tests")]
public class JoinSessionEndpointTests(CustomWebApplicationFactory factory)
{
    private const int MaxNameLength = 100;

    private static readonly string TooLongName = new('a', MaxNameLength + 1);

    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task JoinSession_ReturnsParticipant_WhenSessionExists()
    {
        var session = await _client.CreateSessionAsync();
        var request = new JoinSessionRequest("Linus Torvalds");

        var response = await _client.PostAsJsonAsync(
            $"/api/sessions/{session.Code}/participants",
            request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var participant = await response.Content.ReadFromJsonAsync<JoinSessionResponse>();

        Assert.NotNull(participant);
        Assert.NotEqual(Guid.Empty, participant.ParticipantId);
        Assert.Equal(request.ParticipantName, participant.ParticipantName);
    }

    [Fact]
    public async Task JoinSession_AddsParticipantToSession()
    {
        var session = await _client.CreateSessionAsync();
        var joined = await _client.JoinSessionAsync(session.Code, "Margaret Hamilton");

        var response = await _client.GetAsync(
            $"/api/sessions/{session.Code}/participants/{joined.ParticipantId}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var participant = await response.Content.ReadFromJsonAsync<GetParticipantResponse>();

        Assert.NotNull(participant);
        Assert.Equal(joined.ParticipantId, participant.Id);
        Assert.Equal(joined.ParticipantName, participant.Name);
    }

    [Fact]
    public async Task JoinSession_AllowsMultipleParticipants()
    {
        var session = await _client.CreateSessionAsync();
        var first = await _client.JoinSessionAsync(session.Code, "First participant");
        var second = await _client.JoinSessionAsync(session.Code, "Second participant");

        Assert.NotEqual(first.ParticipantId, second.ParticipantId);
        Assert.NotEqual(session.ParticipantId, first.ParticipantId);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task JoinSession_ReturnsBadRequest_WhenParticipantNameIsEmpty(
        string participantName)
    {
        var session = await _client.CreateSessionAsync();

        var response = await _client.PostAsJsonAsync(
            $"/api/sessions/{session.Code}/participants",
            new JoinSessionRequest(participantName));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task JoinSession_ReturnsBadRequest_WhenParticipantNameIsTooLong()
    {
        var session = await _client.CreateSessionAsync();

        var response = await _client.PostAsJsonAsync(
            $"/api/sessions/{session.Code}/participants",
            new JoinSessionRequest(TooLongName));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task JoinSession_ReturnsNotFound_WhenSessionDoesNotExist()
    {
        var response = await _client.PostAsJsonAsync(
            $"/api/sessions/{Guid.NewGuid():N}/participants",
            new JoinSessionRequest("Participant"));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
