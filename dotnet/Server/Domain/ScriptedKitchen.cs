using System.Runtime.CompilerServices;

namespace BrownBag.Server.Domain;

/// <summary>
/// a kitchen that follows a script rather than a recipe. every dish takes a few seconds, except the brisket, which takes twelve hours.
/// </summary>
public class ScriptedKitchen : IKitchen
{
    private static readonly TimeSpan StepDelay = TimeSpan.FromMilliseconds(800);
    private static readonly TimeSpan BrisketCookTime = TimeSpan.FromHours(12);

    private static readonly string[] DefaultNotes =
    [
        "Chef is googling the recipe.",
        "Ingredients located. Mostly.",
        "Dish has achieved sentience.",
        "Negotiating with dish.",
    ];

    // some dishes get their own commentary
    private static readonly Dictionary<string, string[]> NotesByDish = new()
    {
        ["schrodingers-soup"] = ["Soup is in the box.", "Soup is both hot and cold.", "Soup is both hot and cold. Still.", "Observing the soup..."],
        ["kale"] = ["Chef double-checks the order.", "Chef asks if you're sure.", "Chef respects your choices.", "Kale massaged. Yes, that's a real step."],
        ["merge-conflict-burrito"] = ["<<<<<<< HEAD", "beans", "=======", "rice >>>>>>> feature/lunch"],
        ["friday-hotfix-wings"] = ["Skipping the tests.", "Deploying straight to the fryer.", "Pager is going off.", "It works on my plate."],
    };

    /// <inheritdoc />
    public async IAsyncEnumerable<KitchenUpdate> Cook(Dish dish, [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        yield return new KitchenUpdate(CookingStage.Placed, $"Order received: {dish.Name}.");

        if (dish.Id == "brisket")
        {
            // the deadline demo: this never finishes inside any sensible client deadline
            var remaining = BrisketCookTime;
            while (remaining > TimeSpan.Zero)
            {
                await Task.Delay(TimeSpan.FromSeconds(1), cancellationToken);
                remaining -= TimeSpan.FromSeconds(1);
                yield return new KitchenUpdate(CookingStage.Cooking, $"Brisket in the smoker. {remaining:hh\\h\\ mm\\m\\ ss\\s} remaining.");
            }
        }
        else
        {
            foreach (var note in NotesByDish.GetValueOrDefault(dish.Id, DefaultNotes))
            {
                await Task.Delay(StepDelay, cancellationToken);
                yield return new KitchenUpdate(CookingStage.Cooking, note);
            }
        }

        await Task.Delay(StepDelay, cancellationToken);
        yield return new KitchenUpdate(CookingStage.Ready, "Ready! Collect from the pass before Dave sees it.");
    }
}
