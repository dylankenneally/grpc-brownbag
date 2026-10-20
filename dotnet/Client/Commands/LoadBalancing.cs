using Grpc.Core;
using Grpc.Net.Client;
using Grpc.Net.Client.Balancer;
using Grpc.Net.Client.Configuration;
using Lunch.V1;
using Microsoft.Extensions.DependencyInjection;

namespace BrownBag.Client.Commands;

/// <summary>
/// act 6, the fix: the client knows every kitchen, holds a connection to each, and spreads calls across them itself.
/// </summary>
public static class LoadBalancing
{
    private const int CallCount = 100;

    /// <summary>
    /// fires calls through a round-robin channel and prints how many each kitchen served.
    /// </summary>
    public static async Task Run(int[] ports)
    {
        if (ports.Length == 0)
        {
            Console.Error.WriteLine("[client] lb-fix needs kitchen ports, e.g. lb-fix 5061 5062");
            throw new ArgumentException("lb-fix needs at least one kitchen port", nameof(ports));
        }

        using var channel = CreateRoundRobinChannel(ports);
        var client = new LunchService.LunchServiceClient(channel);
        var quiet = new Metadata { { "x-brownbag-quiet", "1" } };
        await WaitForEveryKitchen(client, quiet, ports.Length);

        var kitchens = await Task.WhenAll(Enumerable.Range(0, CallCount).Select(_ => CallOnce(client, quiet)));
        var tally = kitchens
            .GroupBy(x => x)
            .OrderBy(x => x.Key)
            .Select(x => $"kitchen {x.Key}: {x.Count()}");
        Console.WriteLine($"{Format.Prefix} ⚖️  client-side round robin, {CallCount} calls → {string.Join(", ", tally)}");
    }

    // a static resolver hands the channel a fixed address list; in production this is DNS or service discovery
    private static GrpcChannel CreateRoundRobinChannel(int[] ports)
    {
        var addresses = ports.Select(x => new BalancerAddress("localhost", x)).ToArray();
        var resolver = new StaticResolverFactory(_ => addresses);
        var services = new ServiceCollection();
        services.AddSingleton<ResolverFactory>(resolver);

        var serviceConfig = new ServiceConfig();
        var roundRobin = new RoundRobinConfig();
        serviceConfig.LoadBalancingConfigs.Add(roundRobin);

        var options = new GrpcChannelOptions { Credentials = ChannelCredentials.Insecure, ServiceProvider = services.BuildServiceProvider(), ServiceConfig = serviceConfig };
        return GrpcChannel.ForAddress("static:///kitchens", options);
    }

    // round robin only picks connections that are ready; the first one is ready before the others, so wait for them all
    private static async Task WaitForEveryKitchen(LunchService.LunchServiceClient client, Metadata headers, int kitchenCount)
    {
        var seen = new HashSet<string>();
        for (var attempt = 0; attempt < 100 && seen.Count < kitchenCount; attempt++)
        {
            seen.Add(await CallOnce(client, headers));
            await Task.Delay(20);
        }

        if (seen.Count < kitchenCount)
        {
            Console.Error.WriteLine($"[client] only reached {seen.Count} of {kitchenCount} kitchens; are they all running?");
            throw new InvalidOperationException($"only reached {seen.Count} of {kitchenCount} kitchens");
        }
    }

    private static async Task<string> CallOnce(LunchService.LunchServiceClient client, Metadata headers)
    {
        var request = new GetMenuItemRequest { ItemId = "kale" };
        using var call = client.GetMenuItemAsync(request, headers);
        var responseHeaders = await call.ResponseHeadersAsync;
        await call;
        return responseHeaders.GetValue("x-kitchen") ?? "?";
    }
}
