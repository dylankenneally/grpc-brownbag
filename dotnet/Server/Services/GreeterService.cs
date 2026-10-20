using Greeter.V1;
using Grpc.Core;

namespace BrownBag.Server.Services;

/// <summary>
/// act 1: the whole "server" is one override of a generated base class. no routing, no JSON, no controllers.
/// </summary>
/// <param name="logger">logs each greeting so the audience can watch calls land</param>
public class GreeterService(ILogger<GreeterService> logger) : Greeter.V1.GreeterService.GreeterServiceBase
{
    /// <inheritdoc />
    public override Task<SayHelloResponse> SayHello(SayHelloRequest request, ServerCallContext context)
    {
        // gRPC errors are status codes, not HTTP codes; the client sees a typed RpcException
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            throw new RpcException(new Status(StatusCode.InvalidArgument, "Even anonymous diners need a name for the coffee cup."));
        }

        logger.LogInformation("👋 {Name} said hello via {Peer}", request.Name, context.Peer);

        var response = new SayHelloResponse { Message = $"Hello {request.Name}, welcome to the C# kitchen. Today's special is strongly typed." };
        return Task.FromResult(response);
    }
}
