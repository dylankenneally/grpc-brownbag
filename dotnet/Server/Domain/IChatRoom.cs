using System.Threading.Channels;

namespace BrownBag.Server.Domain;

/// <summary>
/// one line of chat.
/// </summary>
public record ChatLine(string From, string Text);

/// <summary>
/// one diner's seat in the chat room. dispose it to leave.
/// </summary>
public interface IChatSeat : IDisposable
{
    /// <summary>
    /// who's sitting here.
    /// </summary>
    string Diner { get; }

    /// <summary>
    /// everything said to this seat, in order. completes when the seat is disposed.
    /// </summary>
    ChannelReader<ChatLine> Inbox { get; }
}

/// <summary>
/// a shared lunch chat. in-process today; a pub/sub backplane if it ever had to span servers.
/// </summary>
public interface IChatRoom
{
    /// <summary>
    /// takes a seat and tells everyone else.
    /// </summary>
    IChatSeat Join(string diner);

    /// <summary>
    /// says something to everyone else in the room. LunchBot may have opinions.
    /// </summary>
    void Say(IChatSeat seat, string text);
}
