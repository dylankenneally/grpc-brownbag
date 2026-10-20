namespace BrownBag.Server.Domain;

/// <summary>
/// where a dish is up to.
/// </summary>
public enum CookingStage
{
    Placed,
    Cooking,
    Ready,
}

/// <summary>
/// one update from the kitchen.
/// </summary>
public record KitchenUpdate(CookingStage Stage, string Note);

/// <summary>
/// cooks a dish, reporting progress as it goes.
/// </summary>
public interface IKitchen
{
    /// <summary>
    /// yields updates until the dish is ready; stops early (throwing <see cref="OperationCanceledException"/>) when the customer gives up.
    /// </summary>
    IAsyncEnumerable<KitchenUpdate> Cook(Dish dish, CancellationToken cancellationToken);
}
