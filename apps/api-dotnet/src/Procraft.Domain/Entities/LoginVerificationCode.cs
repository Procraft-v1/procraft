namespace Procraft.Domain.Entities;

public sealed class LoginVerificationCode : BaseEntity
{
    public Guid UserId { get; set; }

    public User User { get; set; } = null!;

    public string CodeHash { get; set; } = string.Empty;

    public DateTimeOffset ExpiresAt { get; set; }

    public DateTimeOffset? ConsumedAt { get; set; }

    public int AttemptCount { get; set; }

    public string? CreatedByIp { get; set; }

    public string? UserAgent { get; set; }
}
