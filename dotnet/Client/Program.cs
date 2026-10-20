/*
 * the C# lunch client: `npm run cs -- <command> [args]`
 * - greet [name]          unary call to GreeterService
 * - menu                  unary: the whole menu
 * - item <id>             unary: one dish (try an id that isn't on the menu)
 * - watch <id>            server streaming: live kitchen updates, with a 6 second deadline
 * - team                  client streaming: the whole team's order, one bill back
 * - chat <name>           bidirectional streaming: type to chat, Ctrl+C to leave
 * - lb-fix <port> <port>  client-side round-robin load balancing across kitchens
 * set LUNCH_SERVER to point at a different server (default http://localhost:5051).
 */
using BrownBag.Client;
using BrownBag.Client.Commands;
using System.Text;
using Grpc.Net.Client;

// emoji survive being piped through another process (Windows consoles default to a legacy code page)
Console.OutputEncoding = Encoding.UTF8;

var address = Environment.GetEnvironmentVariable("LUNCH_SERVER") ?? "http://localhost:5051";
var command = args.FirstOrDefault() ?? "greet";
var argument = args.ElementAtOrDefault(1);

// one channel = one HTTP/2 connection, reused by every call; create it once, not per request
using var channel = GrpcChannel.ForAddress(address);

switch (command)
{
    case "greet":
        await Greet.Run(channel, argument ?? Environment.UserName);
        break;
    case "menu":
        await Menu.ShowMenu(channel);
        break;
    case "item":
        await Menu.ShowItem(channel, Args.Required(argument, "item <id>"));
        break;
    case "watch":
        await Watch.Run(channel, Args.Required(argument, "watch <id>"));
        break;
    case "team":
        await Team.Run(channel);
        break;
    case "chat":
        await Chat.Run(channel, argument ?? Environment.UserName);
        break;
    case "lb-fix":
        await LoadBalancing.Run(args.Skip(1).Select(int.Parse).ToArray());
        break;
    default:
        Console.Error.WriteLine($"[client] unknown command \"{command}\"; try: greet, menu, item, watch, team, chat, lb-fix");
        throw new ArgumentException($"unknown command \"{command}\"", nameof(args));
}
