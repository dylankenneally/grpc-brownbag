using System.Collections.Concurrent;
using System.Threading.Channels;

namespace BrownBag.Server.Domain;

/// <summary>
/// an in-process chat room: each seat gets its own unbounded inbox, and saying something copies it into everyone else's.
/// </summary>
public class ChatRoom : IChatRoom
{
    private readonly ConcurrentDictionary<Guid, Seat> seats = new();

    /// <inheritdoc />
    public IChatSeat Join(string diner)
    {
        var seat = new Seat(diner, this);
        seats[seat.Id] = seat;
        var arrival = new ChatLine(LunchBot.Name, $"{diner} pulled up a chair. {seats.Count} at the table.");
        Broadcast(arrival, except: null);
        return seat;
    }

    /// <inheritdoc />
    public void Say(IChatSeat seat, string text)
    {
        var said = new ChatLine(seat.Diner, text);
        Broadcast(said, except: seat);

        // the bot answers everyone, including whoever triggered it
        var reply = LunchBot.ReplyTo(text);
        if (reply is not null)
        {
            var botLine = new ChatLine(LunchBot.Name, reply);
            Broadcast(botLine, except: null);
        }
    }

    private void Broadcast(ChatLine line, IChatSeat? except)
    {
        foreach (var seat in seats.Values)
        {
            if (!ReferenceEquals(seat, except))
            {
                seat.Deliver(line);
            }
        }
    }

    private void Leave(Seat seat)
    {
        if (seats.TryRemove(seat.Id, out _))
        {
            var departure = new ChatLine(LunchBot.Name, $"{seat.Diner} left. Probably to get a coffee.");
            Broadcast(departure, except: null);
        }
    }

    private sealed class Seat(string diner, ChatRoom room) : IChatSeat
    {
        private readonly Channel<ChatLine> inbox = Channel.CreateUnbounded<ChatLine>();

        public Guid Id { get; } = Guid.NewGuid();

        public string Diner => diner;

        public ChannelReader<ChatLine> Inbox => inbox.Reader;

        public void Deliver(ChatLine line) => inbox.Writer.TryWrite(line);

        public void Dispose()
        {
            room.Leave(this);
            inbox.Writer.TryComplete();
        }
    }
}
