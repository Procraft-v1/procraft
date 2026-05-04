namespace Procraft.Application.Common.Models;

public sealed class CurrentUser
{
    public Guid UserId { get; init; }

    public string Email { get; init; } = string.Empty;

    public string Username { get; init; } = string.Empty;
}
