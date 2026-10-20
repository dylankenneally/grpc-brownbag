namespace BrownBag.Server.Domain;

/// <summary>
/// the chat room's resident bot. helpful in the way a printer is helpful.
/// </summary>
public static class LunchBot
{
    /// <summary>
    /// the name LunchBot posts under.
    /// </summary>
    public const string Name = "LunchBot";

    private static readonly (string Keyword, string Reply)[] Replies =
    [
        ("kale", "Kale detected. Alerting the authorities."),
        ("dave", "Dave still owes everyone $14.50."),
        ("deploy", "Deploying lunch to production. No rollback plan."),
        ("bug", "That's not a bug, that's a crouton."),
        ("hungry", "Have you tried turning lunch off and on again?"),
        ("brisket", "The brisket will be ready at approximately the heat death of the universe."),
        ("grpc", "I'm a bidirectional stream. I can talk while you talk. Watch me."),
        ("rest", "REST? On a work day?"),
    ];

    /// <summary>
    /// LunchBot's reply to a message, or null if it has nothing to add (rare).
    /// </summary>
    public static string? ReplyTo(string text)
    {
        foreach (var (keyword, reply) in Replies)
        {
            if (text.Contains(keyword, StringComparison.OrdinalIgnoreCase))
            {
                return reply;
            }
        }

        return null;
    }
}
