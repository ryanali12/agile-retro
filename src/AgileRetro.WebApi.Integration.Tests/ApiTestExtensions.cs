using System.Net.Http.Json;
using AgileRetro.WebApi.Features.Participant.JoinSession;
using AgileRetro.WebApi.Features.Session.CreateSession;

namespace AgileRetro.WebApi.Integration.Tests;

internal static class ApiTestExtensions
{
    public static async Task<CreateSessionResponse> CreateSessionAsync(
        this HttpClient client,
        string? name = null,
        string? participantName = null)
    {
        var response = await client.PostAsJsonAsync(
            "/api/sessions",
            new CreateSessionRequest(
                name ?? $"Retro {Guid.NewGuid():N}",
                participantName ?? "Facilitator"));

        response.EnsureSuccessStatusCode();

        return (await response.Content.ReadFromJsonAsync<CreateSessionResponse>())!;
    }

    public static async Task<JoinSessionResponse> JoinSessionAsync(
        this HttpClient client,
        string code,
        string? participantName = null)
    {
        var response = await client.PostAsJsonAsync(
            $"/api/sessions/{code}/participants",
            new JoinSessionRequest(participantName ?? "Participant"));

        response.EnsureSuccessStatusCode();

        return (await response.Content.ReadFromJsonAsync<JoinSessionResponse>())!;
    }
}
