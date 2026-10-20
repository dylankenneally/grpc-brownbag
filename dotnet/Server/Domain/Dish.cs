namespace BrownBag.Server.Domain;

/// <summary>
/// how much you'll regret it.
/// </summary>
public enum Spice
{
    Mild,
    Medium,
    Hot,
    Regret,
}

/// <summary>
/// one dish on the menu. this is the kitchen's own type; the gRPC and REST layers each map it to their wire shape.
/// </summary>
public record Dish(string Id, string Name, string Description, uint PriceCents, Spice Spice, uint Calories, IReadOnlyList<string> Tags);
