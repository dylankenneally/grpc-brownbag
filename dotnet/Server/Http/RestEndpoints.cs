using BrownBag.Server.Domain;

namespace BrownBag.Server.Http;

/// <summary>
/// the same menu as a plain REST/JSON API, so the demos can compare gRPC against what most teams ship today.
/// </summary>
public static class RestEndpoints
{
    /// <summary>
    /// maps <c>/api/v1/menu</c> and <c>/api/v1/menu/{id}</c>.
    /// </summary>
    public static void MapRestMenu(this IEndpointRouteBuilder app)
    {
        var v1 = app.MapGroup("/api/v1");
        v1.MapGet("/menu", GetMenu);
        v1.MapGet("/menu/{id}", GetMenuItem);
    }

    private static IResult GetMenu(IMenu menu)
    {
        var body = new { items = menu.All };
        return Results.Ok(body);
    }

    private static IResult GetMenuItem(string id, IMenu menu)
    {
        var dish = menu.Find(id);
        if (dish is null)
        {
            var notFound = new { error = $"We're out of \"{id}\". We were never in of \"{id}\"." };
            return Results.NotFound(notFound);
        }

        var body = new { item = dish };
        return Results.Ok(body);
    }
}
