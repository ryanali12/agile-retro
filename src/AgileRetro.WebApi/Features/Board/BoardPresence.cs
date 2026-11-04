using System.Threading;

namespace AgileRetro.WebApi.Features.Board;

/// <summary>
/// Tracks which participants currently have at least one live board connection.
/// SignalR creates a hub instance per invocation, so presence must live in a
/// singleton. A participant with several tabs stays online until the last
/// connection closes.
/// </summary>
public sealed class BoardPresence
{
    private readonly Lock _gate = new();
    private readonly Dictionary<Guid, Dictionary<string, PresenceEntry>> _sessions = [];
    private readonly Dictionary<string, Guid> _connectionSessions = [];

    public IReadOnlyList<BoardParticipantResponse> Join(
        Guid sessionId,
        string connectionId,
        Guid participantId,
        string name)
    {
        lock (_gate)
        {
            _connectionSessions[connectionId] = sessionId;

            if (!_sessions.TryGetValue(sessionId, out var connections))
            {
                connections = [];
                _sessions[sessionId] = connections;
            }

            connections[connectionId] = new PresenceEntry(participantId, name);

            return GetActiveLocked(sessionId);
        }
    }

    public PresenceLeave? Leave(string connectionId)
    {
        lock (_gate)
        {
            if (!_connectionSessions.Remove(connectionId, out var sessionId))
                return null;

            if (_sessions.TryGetValue(sessionId, out var connections))
            {
                connections.Remove(connectionId);

                if (connections.Count == 0)
                    _sessions.Remove(sessionId);
            }

            return new PresenceLeave(sessionId, GetActiveLocked(sessionId));
        }
    }

    public IReadOnlyList<BoardParticipantResponse> GetActive(Guid sessionId)
    {
        lock (_gate)
        {
            return GetActiveLocked(sessionId);
        }
    }

    private IReadOnlyList<BoardParticipantResponse> GetActiveLocked(Guid sessionId)
    {
        if (!_sessions.TryGetValue(sessionId, out var connections))
            return [];

        return connections.Values
            .GroupBy(entry => entry.ParticipantId)
            .Select(group => new BoardParticipantResponse(
                group.Key,
                group.First().Name))
            .OrderBy(participant => participant.Name, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private readonly record struct PresenceEntry(Guid ParticipantId, string Name);
}

public sealed record PresenceLeave(
    Guid SessionId,
    IReadOnlyList<BoardParticipantResponse> Participants);
