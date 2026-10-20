using BrownBag.Server.Domain;
using Grpc.Core;
using Lunch.V1;

namespace BrownBag.Server.Services;

/// <summary>
/// the four gRPC call patterns, one method each (plus a bonus unary). each method is thin: validate, call the domain, map the result.
/// </summary>
/// <param name="menu">what's on offer</param>
/// <param name="kitchen">cooks dishes for WatchOrder</param>
/// <param name="chatRoom">the shared room behind LunchChat</param>
/// <param name="logger">narrates calls in the server terminal</param>
public class LunchService(IMenu menu, IKitchen kitchen, IChatRoom chatRoom, ILogger<LunchService> logger) : Lunch.V1.LunchService.LunchServiceBase
{
    /// <summary>
    /// request header carrying the diner's name for the chat; metadata travels alongside the messages, like HTTP headers.
    /// </summary>
    public const string DinerHeader = "x-diner";

    /// <inheritdoc />
    public override Task<GetMenuResponse> GetMenu(GetMenuRequest request, ServerCallContext context)
    {
        var response = new GetMenuResponse();
        response.Items.AddRange(menu.All.Select(x => x.ToProto()));
        return Task.FromResult(response);
    }

    /// <inheritdoc />
    public override Task<GetMenuItemResponse> GetMenuItem(GetMenuItemRequest request, ServerCallContext context)
    {
        var dish = FindOrThrow(request.ItemId);
        var response = new GetMenuItemResponse { Item = dish.ToProto() };
        return Task.FromResult(response);
    }

    /// <inheritdoc />
    public override async Task WatchOrder(WatchOrderRequest request, IServerStreamWriter<WatchOrderResponse> responseStream, ServerCallContext context)
    {
        var dish = FindOrThrow(request.ItemId);
        logger.LogInformation("🍳 cooking {Dish}", dish.Name);

        try
        {
            // the cancellation token fires when the client's deadline passes or it hangs up, so the kitchen stops cooking for nobody
            await foreach (var update in kitchen.Cook(dish, context.CancellationToken))
            {
                await responseStream.WriteAsync(update.ToProto());
            }

            logger.LogInformation("✅ {Dish} served", dish.Name);
        }
        catch (OperationCanceledException) when (context.CancellationToken.IsCancellationRequested)
        {
            // clients often hang up a moment before the server's own deadline timer fires, so allow some slack
            var reason = context.Deadline - DateTime.UtcNow < TimeSpan.FromSeconds(1) ? StatusCode.DeadlineExceeded : StatusCode.Cancelled;
            logger.LogWarning("🍖 customer gave up on the {Dish} ({Reason}); chef turned off the smoker", dish.Name, reason);
            context.Status = new Status(reason, "Customer left before the food did.");
        }
    }

    /// <inheritdoc />
    public override async Task<PlaceTeamOrderResponse> PlaceTeamOrder(IAsyncStreamReader<PlaceTeamOrderRequest> requestStream, ServerCallContext context)
    {
        var lines = new List<TeamLine>();
        await foreach (var line in requestStream.ReadAllAsync(context.CancellationToken))
        {
            if (line.Quantity == 0)
            {
                throw new RpcException(new Status(StatusCode.InvalidArgument, $"{line.Diner} ordered zero of something. That's not an order, that's a mood."));
            }

            var dish = FindOrThrow(line.ItemId);
            logger.LogInformation("📝 {Diner} added {Quantity} × {Dish}", line.Diner, line.Quantity, dish.Name);
            var teamLine = new TeamLine(line.Diner, dish, line.Quantity);
            lines.Add(teamLine);
        }

        var bill = TeamOrder.Summarise(lines);
        var response = new PlaceTeamOrderResponse { LineCount = (uint)bill.LineCount, TotalCents = bill.TotalCents, Remark = bill.Remark };
        response.Diners.AddRange(bill.Diners.Select(x => new DinerTotal { Diner = x.Diner, TotalCents = x.TotalCents }));
        return response;
    }

    /// <inheritdoc />
    public override async Task LunchChat(IAsyncStreamReader<LunchChatRequest> requestStream, IServerStreamWriter<LunchChatResponse> responseStream, ServerCallContext context)
    {
        var diner = context.RequestHeaders.GetValue(DinerHeader);
        if (string.IsNullOrWhiteSpace(diner))
        {
            throw new RpcException(new Status(StatusCode.InvalidArgument, $"Chat needs an {DinerHeader} header. LunchBot refuses to talk to strangers."));
        }

        logger.LogInformation("💬 {Diner} joined the chat", diner);
        var seat = chatRoom.Join(diner);

        // both directions run at once: one loop sends what the room says, the other reads what this diner says
        var sending = SendInbox(seat, responseStream, context.CancellationToken);
        try
        {
            await foreach (var message in requestStream.ReadAllAsync(context.CancellationToken))
            {
                chatRoom.Say(seat, message.Text);
            }
        }
        finally
        {
            // leaving completes the inbox, which ends the sending loop
            seat.Dispose();
            logger.LogInformation("💬 {Diner} left the chat", diner);
        }

        await sending;
    }

    // a stream may only have one writer at a time, so everything for this diner funnels through their inbox
    private static async Task SendInbox(IChatSeat seat, IServerStreamWriter<LunchChatResponse> responseStream, CancellationToken cancellationToken)
    {
        await foreach (var line in seat.Inbox.ReadAllAsync(cancellationToken))
        {
            var response = new LunchChatResponse { From = line.From, Text = line.Text };
            await responseStream.WriteAsync(response, cancellationToken);
        }
    }

    private Dish FindOrThrow(string itemId)
    {
        var dish = menu.Find(itemId);
        if (dish is null)
        {
            throw new RpcException(new Status(StatusCode.NotFound, $"We're out of \"{itemId}\". We were never in of \"{itemId}\"."));
        }

        return dish;
    }
}
