namespace BrownBag.Server;

/// <summary>
/// which kitchen this process is, and where it listens. override on the command line, e.g. <c>--Kitchen:Name=B --Kitchen:GrpcPort=5062</c>.
/// </summary>
public class KitchenOptions
{
    /// <summary>
    /// the configuration section these options bind from.
    /// </summary>
    public const string Section = "Kitchen";

    /// <summary>
    /// shown in logs and sent back in the x-kitchen response header, so a client can tell kitchens apart.
    /// </summary>
    public string Name { get; set; } = "Main";

    /// <summary>
    /// native gRPC: plaintext HTTP/2 only.
    /// </summary>
    public int GrpcPort { get; set; } = 5051;

    /// <summary>
    /// HTTP/1.1: gRPC-Web for browsers, plus the REST API.
    /// </summary>
    public int HttpPort { get; set; } = 5080;
}
