using System.Net;
using System.Net.Http.Json;
using AgileRetro.WebApi.Features.Session.GetSession;

namespace AgileRetro.WebApi.Integration.Tests.Features.Session.GetSession;

[Collection("Integration Tests")]
public class GetSessionByCodeEndpointTests(CustomWebApplicationFactory factory)
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task GetSessionByCode_ReturnsSession_WhenCodeExists()
    {
        var created = await _client.CreateSessionAsync();

        var response = await _client.GetAsync($"/api/sessions/by-code/{created.Code}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var session = await response.Content.ReadFromJsonAsync<GetSessionResponse>();

        Assert.NotNull(session);
        Assert.Equal(created.Id, session.Id);
        Assert.Equal(created.Name, session.Name);
        Assert.Equal(created.Code, session.Code);
    }

    [Fact]
    public async Task GetSessionByCode_ReturnsNotFound_WhenCodeDoesNotExist()
    {
        var response = await _client.GetAsync($"/api/sessions/by-code/{Guid.NewGuid():N}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
