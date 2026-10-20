namespace BrownBag.Server.Domain;

/// <summary>
/// what's on offer. in-memory today; a database tomorrow without touching the gRPC or REST layers.
/// </summary>
public interface IMenu
{
    /// <summary>
    /// every dish, in menu order.
    /// </summary>
    IReadOnlyList<Dish> All { get; }

    /// <summary>
    /// one dish by id, or null if we were never in of that.
    /// </summary>
    Dish? Find(string id);
}
