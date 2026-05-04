namespace Procraft.Application.Common.Interfaces;

/// <summary>HTTP request metadata surfaced to application workflows without coupling to MVC.</summary>
public interface IRequestContext
{
    string? IpAddress { get; }

    string? UserAgent { get; }
}
