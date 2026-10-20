using BrownBag.Server.Domain;
using Lunch.V1;

namespace BrownBag.Server.Services;

/// <summary>
/// maps the kitchen's own types onto the generated protobuf messages. the wire contract and the domain can then evolve separately.
/// </summary>
public static class ProtoMapping
{
    /// <summary>
    /// a domain dish as a protobuf MenuItem.
    /// </summary>
    public static MenuItem ToProto(this Dish dish)
    {
        var item = new MenuItem { Id = dish.Id, Name = dish.Name, Description = dish.Description, PriceCents = dish.PriceCents, SpiceLevel = dish.Spice.ToProto(), Calories = dish.Calories };
        item.Tags.AddRange(dish.Tags);
        return item;
    }

    /// <summary>
    /// a domain kitchen update as a protobuf WatchOrderResponse.
    /// </summary>
    public static WatchOrderResponse ToProto(this KitchenUpdate update) => new() { Stage = update.Stage.ToProto(), Note = update.Note };

    private static SpiceLevel ToProto(this Spice spice) => spice switch
    {
        Spice.Mild => SpiceLevel.Mild,
        Spice.Medium => SpiceLevel.Medium,
        Spice.Hot => SpiceLevel.Hot,
        Spice.Regret => SpiceLevel.Regret,
        _ => throw new ArgumentOutOfRangeException(nameof(spice), spice, "no protobuf spice level for this spice"),
    };

    private static OrderStage ToProto(this CookingStage stage) => stage switch
    {
        CookingStage.Placed => OrderStage.Placed,
        CookingStage.Cooking => OrderStage.Cooking,
        CookingStage.Ready => OrderStage.Ready,
        _ => throw new ArgumentOutOfRangeException(nameof(stage), stage, "no protobuf order stage for this cooking stage"),
    };
}
