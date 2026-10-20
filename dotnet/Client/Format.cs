using System.Globalization;
using Lunch.V1;

namespace BrownBag.Client;

/// <summary>
/// console formatting shared by the commands.
/// </summary>
public static class Format
{
    /// <summary>
    /// prefix on every line this client prints, so it's easy to tell apart from the TypeScript client.
    /// </summary>
    public const string Prefix = "🟣 C#";

    /// <summary>
    /// whole cents as dollars, e.g. 1250 → $12.50.
    /// </summary>
    public static string Money(uint cents) => (cents / 100m).ToString("C", CultureInfo.GetCultureInfo("en-US"));

    /// <summary>
    /// one dish on one line.
    /// </summary>
    public static string Dish(MenuItem item) => $"{item.Name,-34} {Money(item.PriceCents),8}  {Spice(item.SpiceLevel)}  {item.Description}";

    /// <summary>
    /// a spice level as chillies.
    /// </summary>
    public static string Spice(SpiceLevel level) => level switch
    {
        SpiceLevel.Mild => "🌶️      ",
        SpiceLevel.Medium => "🌶️🌶️    ",
        SpiceLevel.Hot => "🌶️🌶️🌶️  ",
        SpiceLevel.Regret => "☠️      ",
        _ => "?       ",
    };
}
