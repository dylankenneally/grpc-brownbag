namespace BrownBag.Client;

/// <summary>
/// command-line argument checks.
/// </summary>
public static class Args
{
    /// <summary>
    /// returns the argument, or explains the usage and throws when it's missing.
    /// </summary>
    public static string Required(string? value, string usage)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            Console.Error.WriteLine($"[client] missing argument; usage: {usage}");
            throw new ArgumentException($"missing argument; usage: {usage}", nameof(value));
        }

        return value;
    }
}
