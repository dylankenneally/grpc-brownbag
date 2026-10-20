/*
 * the C# lunch server ("the kitchen").
 * - native gRPC over plaintext HTTP/2 (h2c) on localhost:5051, with server reflection so tools can discover the API
 * - HTTP/1.1 on localhost:5080: gRPC-Web for browsers, plus the same menu as REST/JSON under /api/v1
 * - run several kitchens side by side with --Kitchen:Name, --Kitchen:GrpcPort and --Kitchen:HttpPort
 * - NO authentication and NO TLS: a localhost demo, not a template; production gRPC runs over TLS behind real auth.
 *   CORS is open to any localhost origin so the browser demo works; anything else on this machine can call it too.
 */
using System.Text;
using System.Text.Json.Serialization;
using BrownBag.Server;
using BrownBag.Server.Domain;
using BrownBag.Server.Http;
using BrownBag.Server.Services;
using Grpc.AspNetCore.Web;
using Microsoft.AspNetCore.Server.Kestrel.Core;

// emoji survive being piped through another process (Windows consoles default to a legacy code page)
Console.OutputEncoding = Encoding.UTF8;

var builder = WebApplication.CreateBuilder(args);
var kitchen = builder.Configuration.GetSection(KitchenOptions.Section).Get<KitchenOptions>() ?? new KitchenOptions();

builder.WebHost.ConfigureKestrel(kestrel =>
{
    var connectionLogger = kestrel.ApplicationServices.GetRequiredService<ILoggerFactory>().CreateLogger("BrownBag.Connections");

    // without TLS there is no ALPN to negotiate HTTP/2, so the gRPC port speaks HTTP/2 only ("prior knowledge")
    kestrel.ListenLocalhost(kitchen.GrpcPort, listen => listen.LogConnections(connectionLogger, kitchen.Name, kitchen.GrpcPort).Protocols = HttpProtocols.Http2);

    // browsers and REST clients speak HTTP/1.1 here; gRPC-Web is designed to work over it
    kestrel.ListenLocalhost(kitchen.HttpPort, listen => listen.LogConnections(connectionLogger, kitchen.Name, kitchen.HttpPort).Protocols = HttpProtocols.Http1);
});

builder.Services.AddGrpc();
builder.Services.AddGrpcReflection();
builder.Services.AddSingleton<IMenu, InMemoryMenu>();
builder.Services.AddSingleton<IKitchen, ScriptedKitchen>();
builder.Services.AddSingleton<IChatRoom, ChatRoom>();
builder.Services.ConfigureHttpJsonOptions(json => json.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddCors(cors => cors.AddDefaultPolicy(policy => policy.SetIsOriginAllowed(IsLocalhost).AllowAnyHeader().AllowAnyMethod().WithExposedHeaders(DemoMiddleware.ExposedHeaders)));

var app = builder.Build();

app.UseCors();
app.UseGrpcWeb(new GrpcWebOptions { DefaultEnabled = true });
app.UseKitchenStamp(kitchen.Name);

app.MapGrpcService<GreeterService>();
app.MapGrpcService<LunchService>();
app.MapGrpcReflectionService();
app.MapRestMenu();

app.Logger.LogInformation("🍽️  Kitchen {Kitchen} open: gRPC on http://localhost:{GrpcPort}, gRPC-Web + REST on http://localhost:{HttpPort}", kitchen.Name, kitchen.GrpcPort, kitchen.HttpPort);
app.Run();

static bool IsLocalhost(string origin) => Uri.TryCreate(origin, UriKind.Absolute, out var uri) && uri.IsLoopback;
