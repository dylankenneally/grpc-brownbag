using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Server.Kestrel.Core;

namespace BrownBag.Server.Http;

/// <summary>
/// demo plumbing that makes the invisible visible: which kitchen and which TCP connection served each call.
/// </summary>
public static class DemoMiddleware
{
    /// <summary>
    /// response header naming the kitchen that served the call (load balancing demo).
    /// </summary>
    public const string KitchenHeader = "x-kitchen";

    /// <summary>
    /// response header carrying Kestrel's id for the TCP connection the call arrived on (multiplexing demo).
    /// </summary>
    public const string ConnectionHeader = "x-kitchen-connection";

    /// <summary>
    /// request header that turns off per-request logging, for the tools that fire hundreds of calls.
    /// </summary>
    public const string QuietHeader = "x-brownbag-quiet";

    /// <summary>
    /// the response headers every client can expose to the audience. browsers only see headers listed in CORS.
    /// </summary>
    public static readonly string[] ExposedHeaders = [KitchenHeader, ConnectionHeader, "grpc-status", "grpc-message", "grpc-status-details-bin"];

    /// <summary>
    /// stamps the kitchen and connection on every response, then logs one line per request with the HTTP and gRPC status.
    /// </summary>
    public static IApplicationBuilder UseKitchenStamp(this IApplicationBuilder app, string kitchen)
    {
        var logger = app.ApplicationServices.GetRequiredService<ILoggerFactory>().CreateLogger("BrownBag.Requests");
        return app.Use(async (context, next) =>
        {
            context.Response.Headers[KitchenHeader] = kitchen;
            context.Response.Headers[ConnectionHeader] = context.Connection.Id;
            await next(context);

            if (context.Request.Headers.ContainsKey(QuietHeader))
            {
                return;
            }

            // gRPC reports its own outcome in a trailer; HTTP 200 only means the kitchen answered the door
            // an error before any message is a "trailers-only" response, so the status rides in the headers instead
            var trailerStatus = context.Features.Get<IHttpResponseTrailersFeature>()?.Trailers["grpc-status"].ToString();
            var grpcStatus = string.IsNullOrEmpty(trailerStatus) ? context.Response.Headers["grpc-status"].ToString() : trailerStatus;
            var outcome = string.IsNullOrEmpty(grpcStatus) ? $"{context.Response.StatusCode}" : $"{context.Response.StatusCode}, grpc-status {grpcStatus}";
            logger.LogInformation("🧾 {Protocol} {Method} {Path} → {Outcome} on connection {Connection}", context.Request.Protocol, context.Request.Method, context.Request.Path, outcome, context.Connection.Id);
        });
    }

    /// <summary>
    /// logs each new TCP connection on a Kestrel endpoint, before any HTTP happens on it.
    /// </summary>
    public static ListenOptions LogConnections(this ListenOptions listen, ILogger logger, string kitchen, int port)
    {
        listen.Use(next => async connection =>
        {
            logger.LogInformation("🔌 kitchen {Kitchen}: new TCP connection {Connection} on port {Port}", kitchen, connection.ConnectionId, port);
            await next(connection);
        });
        return listen;
    }
}
