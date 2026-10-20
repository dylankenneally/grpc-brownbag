namespace BrownBag.Server.Domain;

/// <summary>
/// one diner's line on a team order.
/// </summary>
public record TeamLine(string Diner, Dish Dish, uint Quantity);

/// <summary>
/// what one diner owes.
/// </summary>
public record DinerBill(string Diner, uint TotalCents);

/// <summary>
/// the bill for the whole team.
/// </summary>
public record TeamBill(int LineCount, uint TotalCents, IReadOnlyList<DinerBill> Diners, string Remark);

/// <summary>
/// totals a team order. pure arithmetic plus some editorialising.
/// </summary>
public static class TeamOrder
{
    /// <summary>
    /// totals each diner and the whole order, and adds a remark about the team's choices.
    /// </summary>
    public static TeamBill Summarise(IReadOnlyList<TeamLine> lines)
    {
        var diners = lines
            .GroupBy(x => x.Diner)
            .Select(x => new DinerBill(x.Key, (uint)x.Sum(y => (long)y.Dish.PriceCents * y.Quantity)))
            .ToArray();
        var total = (uint)diners.Sum(x => (long)x.TotalCents);
        return new TeamBill(lines.Count, total, diners, Remark(lines));
    }

    private static string Remark(IReadOnlyList<TeamLine> lines)
    {
        if (lines.Count == 0)
        {
            return "Nobody ordered anything. Bold strategy.";
        }

        if (lines.Any(x => x.Diner.Equals("Dave", StringComparison.OrdinalIgnoreCase)))
        {
            return "Dave owes you money. Dave always owes you money.";
        }

        if (lines.Any(x => x.Dish.Id == "kale"))
        {
            return "Someone ordered the kale. Respect.";
        }

        return "Nobody ordered the kale. As expected.";
    }
}
