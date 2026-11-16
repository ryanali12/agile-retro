using System.Threading.Channels;
using AgileRetro.WebApi.Features.Board;
using Microsoft.AspNetCore.Http.Connections;
using Microsoft.AspNetCore.SignalR.Client;

namespace AgileRetro.WebApi.Integration.Tests;

internal static class BoardHubTestExtensions
{
    public static readonly TimeSpan DefaultTimeout = TimeSpan.FromSeconds(10);

    public static async Task<HubConnection> ConnectToBoardHubAsync(
        this CustomWebApplicationFactory factory)
    {
        var connection = new HubConnectionBuilder()
            .WithUrl(
                new Uri(factory.Server.BaseAddress, "hubs/board"),
                options =>
                {
                    options.Transports = HttpTransportType.LongPolling;
                    options.HttpMessageHandlerFactory = _ => factory.Server.CreateHandler();
                })
            .Build();

        await connection.StartAsync().WaitAsync(DefaultTimeout);

        return connection;
    }

    public static Task<BoardSnapshot> JoinBoardAsync(
        this HubConnection connection,
        string? code,
        Guid participantId)
    {
        return connection
            .InvokeAsync<BoardSnapshot>("JoinBoard", code, participantId)
            .WaitAsync(DefaultTimeout);
    }

    public static Task<BoardCardResponse> CreateCardAsync(
        this HubConnection connection,
        string? columnKey,
        string? text)
    {
        return connection
            .InvokeAsync<BoardCardResponse>(
                "CreateCard",
                new CreateBoardCardRequest(columnKey, text))
            .WaitAsync(DefaultTimeout);
    }

    public static Task<BoardCardResponse> UpdateCardAsync(
        this HubConnection connection,
        Guid cardId,
        string? text)
    {
        return connection
            .InvokeAsync<BoardCardResponse>(
                "UpdateCard",
                new UpdateBoardCardRequest(cardId, text))
            .WaitAsync(DefaultTimeout);
    }

    public static Task<Guid> DeleteCardAsync(this HubConnection connection, Guid cardId)
    {
        return connection
            .InvokeAsync<Guid>("DeleteCard", new DeleteBoardCardRequest(cardId))
            .WaitAsync(DefaultTimeout);
    }

    public static ChannelReader<T> EventChannel<T>(
        this HubConnection connection,
        string methodName)
    {
        var channel = Channel.CreateUnbounded<T>(new UnboundedChannelOptions
        {
            SingleReader = true,
            SingleWriter = false,
            AllowSynchronousContinuations = false,
        });

        connection.On<T>(methodName, payload => channel.Writer.TryWrite(payload));

        return channel.Reader;
    }

    public static Task<T> ReadEventAsync<T>(this ChannelReader<T> reader)
    {
        return reader.ReadAsync().AsTask().WaitAsync(DefaultTimeout);
    }
}
