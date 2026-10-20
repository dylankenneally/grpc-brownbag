namespace BrownBag.Server.Domain;

/// <summary>
/// a fixed menu baked into the binary. every kitchen instance serves the same dishes.
/// </summary>
public class InMemoryMenu : IMenu
{
    private static readonly Dish[] Dishes =
    [
        new("existential-crisis", "The Existential Crisis Sandwich", "Two slices of sourdough questioning why they're here.", 1250, Spice.Mild, 640, ["vegetarian", "bestseller"]),
        new("schrodingers-soup", "Schrödinger's Soup", "Simultaneously hot and cold until observed.", 900, Spice.Medium, 310, ["vegan", "quantum"]),
        new("kale", "Kale (nobody orders this)", "It's good for you. That's the whole pitch.", 1100, Spice.Mild, 120, ["vegan", "virtuous"]),
        new("brisket", "12-Hour Slow-Cooked Brisket", "Worth the wait. You will not be waiting.", 2400, Spice.Medium, 980, ["slow", "very slow"]),
        new("merge-conflict-burrito", "Merge Conflict Burrito", "Two fillings that both think they're right.", 1450, Spice.Hot, 870, ["contested"]),
        new("null-pointer-nachos", "Null Pointer Nachos", "Cheese may or may not be present.", 1300, Spice.Hot, 760, ["undefined behaviour"]),
        new("legacy-lasagne", "Legacy Lasagne", "Layers nobody understands, written by someone who left in 2009.", 1600, Spice.Mild, 910, ["do not touch"]),
        new("friday-hotfix-wings", "Friday Hotfix Wings", "Applied at 4:59pm. What could go wrong?", 1500, Spice.Regret, 820, ["risky", "no rollback"]),
        new("stack-overflow-pancakes", "Stack Overflow Pancakes", "Pancakes all the way down. Marked as duplicate.", 1000, Spice.Mild, 700, ["recursive"]),
    ];

    private static readonly Dictionary<string, Dish> ById = Dishes.ToDictionary(x => x.Id);

    /// <inheritdoc />
    public IReadOnlyList<Dish> All => Dishes;

    /// <inheritdoc />
    public Dish? Find(string id) => ById.GetValueOrDefault(id);
}
