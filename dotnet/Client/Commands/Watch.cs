using Grpc.Core;
using Grpc.Net.Client;
using Lunch.V1;

namespace BrownBag.Client.Commands;

/// <summary>
/// act 2, server streaming plus a deadline: one request, then updates arrive as the kitchen produces them.
/// </summary>
public static class Watch
{
    // long enough for any normal dish, nowhere near long enough for the brisket
    private static readonly TimeSpan Patience = TimeSpan.FromSeconds(6);

    /// <summary>
    /// orders a dish and prints each kitchen update until it's ready or our patience runs out.
    /// </summary>
    public static async Task Run(GrpcChannel channel, string itemId)
    {
        var client = new LunchService.LunchServiceClient(channel);
        var request = new WatchOrderRequest { ItemId = itemId };

        // a deadline travels with the call; the server sees it too and can stop work nobody is waiting for
        var deadline = DateTime.UtcNow.Add(Patience);
        using var call = client.WatchOrder(request, deadline: deadline);
        Console.WriteLine($"{Format.Prefix} ⏱️  watching \"{itemId}\" (giving up after {Patience.TotalSeconds:0}s)");

        try
        {
            await foreach (var update in call.ResponseStream.ReadAllAsync())
            {
                Console.WriteLine($"{Format.Prefix} {Stage(update.Stage)} {update.Note}");
            }
        }
        catch (RpcException ex) when (ex.StatusCode == StatusCode.DeadlineExceeded)
        {
            // an expected outcome in this demo (hello, brisket), so it's reported rather than thrown
            Console.WriteLine($"{Format.Prefix} ✗ {ex.StatusCode}: waited {Patience.TotalSeconds:0}s and gave up. The server was told, and stopped cooking.");
        }
        catch (RpcException ex) when (ex.StatusCode == StatusCode.NotFound)
        {
            Console.WriteLine($"{Format.Prefix} ✗ {ex.StatusCode}: {ex.Status.Detail}");
        }
    }

    private static string Stage(OrderStage stage) => stage switch
    {
        OrderStage.Placed => "🧾",
        OrderStage.Cooking => "🔥",
        OrderStage.Ready => "✅",
        _ => "❔",
    };
}
