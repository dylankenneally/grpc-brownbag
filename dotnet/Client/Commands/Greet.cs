using Greeter.V1;
using Grpc.Core;
using Grpc.Net.Client;

namespace BrownBag.Client.Commands;

/// <summary>
/// act 1: a remote call that reads like a local method call.
/// </summary>
public static class Greet
{
    /// <summary>
    /// says hello to the server and prints the reply.
    /// </summary>
    public static async Task Run(GrpcChannel channel, string name)
    {
        // the client class is generated from greeter.proto; no URLs, no JSON, no HttpClient plumbing
        var client = new GreeterService.GreeterServiceClient(channel);
        var request = new SayHelloRequest { Name = name };

        try
        {
            var reply = await client.SayHelloAsync(request);
            Console.WriteLine($"{Format.Prefix} → {reply.Message}");
        }
        catch (RpcException ex)
        {
            // gRPC failures arrive as a status code plus detail, not an HTTP status and a body to parse
            Console.Error.WriteLine($"{Format.Prefix} ✗ {ex.StatusCode}: {ex.Status.Detail}");
            throw;
        }
    }
}
