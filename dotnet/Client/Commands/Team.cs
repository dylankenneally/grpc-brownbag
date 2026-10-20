using Grpc.Net.Client;
using Lunch.V1;

namespace BrownBag.Client.Commands;

/// <summary>
/// act 2, client streaming: many messages up, one response back.
/// </summary>
public static class Team
{
    private static readonly (string Diner, string ItemId, uint Quantity)[] Orders =
    [
        ("Ada", "merge-conflict-burrito", 1),
        ("Grace", "schrodingers-soup", 1),
        ("Linus", "null-pointer-nachos", 2),
        ("Margaret", "kale", 1),
        ("Dave", "brisket", 3),
    ];

    /// <summary>
    /// streams each diner's line to the kitchen, then prints the bill.
    /// </summary>
    public static async Task Run(GrpcChannel channel)
    {
        var client = new LunchService.LunchServiceClient(channel);
        using var call = client.PlaceTeamOrder();

        foreach (var (diner, itemId, quantity) in Orders)
        {
            var line = new PlaceTeamOrderRequest { Diner = diner, ItemId = itemId, Quantity = quantity };
            await call.RequestStream.WriteAsync(line);
            Console.WriteLine($"{Format.Prefix} ⬆️  {diner} adds {quantity} × {itemId}");

            // a pause so the audience can watch the lines arrive at the server one at a time
            await Task.Delay(400);
        }

        // completing the request stream is the "that's everyone" signal; only then does the server reply
        await call.RequestStream.CompleteAsync();
        var bill = await call;

        Console.WriteLine($"{Format.Prefix} 🧾 {bill.LineCount} lines, total {Format.Money(bill.TotalCents)}");
        foreach (var diner in bill.Diners)
        {
            Console.WriteLine($"   {diner.Diner,-10} {Format.Money(diner.TotalCents),8}");
        }

        Console.WriteLine($"{Format.Prefix} 💬 {bill.Remark}");
    }
}
