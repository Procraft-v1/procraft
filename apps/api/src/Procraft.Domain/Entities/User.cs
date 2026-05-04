namespace Procraft.Domain.Entities;

public sealed class User : BaseEntity
{
    public string Email { get; set; } = string.Empty;

    public string Username { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public bool IsEmailConfirmed { get; set; }

    public Profile? Profile { get; set; }

    public ICollection<Subscription> Subscriptions { get; set; } = new List<Subscription>();

    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}
