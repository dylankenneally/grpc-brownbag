using Grpc.Core;
using Grpc.Net.Client;
using Lunch.V1;

namespace BrownBag.Client.Commands;

/// <summary>
/// act 2, unary: one request, one response.
/// </summary>
public static class Menu
{
    /// <summary>
    /// prints the whole menu.
    /// </summary>
    public static async Task ShowMenu(GrpcChannel channel)
    {
        var client = new LunchService.LunchServiceClient(channel);
        var request = new GetMenuRequest();
        var response = await client.GetMenuAsync(request);

        Console.WriteLine($"{Format.Prefix} 📜 today's menu ({response.Items.Count} dishes):");
        foreach (var item in response.Items)
        {
            Console.WriteLine($"   {Format.Dish(item)}");
        }
    }

    /// <summary>
    /// prints one dish; a dish that isn't on the menu prints the server's NOT_FOUND rather than failing.
    /// </summary>
    public static async Task ShowItem(GrpcChannel channel, string itemId)
    {
        var client = new LunchService.LunchServiceClient(channel);
        var request = new GetMenuItemRequest { ItemId = itemId };

        try
        {
            var response = await client.GetMenuItemAsync(request);
            Console.WriteLine($"{Format.Prefix} 🍽️  {Format.Dish(response.Item)}");
        }
        catch (RpcException ex) when (ex.StatusCode == StatusCode.NotFound)
        {
            // an expected outcome for this demo, so it's reported rather than thrown
            Console.WriteLine($"{Format.Prefix} ✗ {ex.StatusCode}: {ex.Status.Detail}");
        }
    }
}
