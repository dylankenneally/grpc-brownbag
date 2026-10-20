using Grpc.Core;
using Grpc.Net.Client;
using Lunch.V1;

namespace BrownBag.Client.Commands;

/// <summary>
/// act 2, bidirectional streaming: both sides talk whenever they like, over one call.
/// </summary>
public static class Chat
{
    /// <summary>
    /// joins the lunch chat; each line typed is sent, and everything the room says is printed as it arrives.
    /// </summary>
    public static async Task Run(GrpcChannel channel, string diner)
    {
        var client = new LunchService.LunchServiceClient(channel);

        // the name travels as call metadata (a header), not inside every message
        var headers = new Metadata { { "x-diner", diner } };
        using var call = client.LunchChat(headers);
        Console.WriteLine($"{Format.Prefix} 💬 joined as {diner}; type a message and press Enter (Ctrl+C or end of input to leave)");

        var receiving = Receive(call.ResponseStream);
        while (Console.ReadLine() is { } text)
        {
            if (string.IsNullOrWhiteSpace(text))
            {
                continue;
            }

            var message = new LunchChatRequest { Text = text };
            await call.RequestStream.WriteAsync(message);
        }

        await call.RequestStream.CompleteAsync();
        await receiving;
    }

    private static async Task Receive(IAsyncStreamReader<LunchChatResponse> responses)
    {
        await foreach (var line in responses.ReadAllAsync())
        {
            Console.WriteLine($"   {line.From}: {line.Text}");
        }
    }
}
