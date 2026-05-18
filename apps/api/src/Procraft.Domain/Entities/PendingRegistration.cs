namespace Procraft.Domain.Entities;

public sealed class PendingRegistration : BaseEntity
{
    public string Email { get; set; } = string.Empty;

    public string Username { get; set; } = string.Empty;

    public string? PhoneNumber { get; set; }

    public string PasswordHash { get; set; } = string.Empty;

    public string CodeHash { get; set; } = string.Empty;

    public DateTimeOffset ExpiresAt { get; set; }

    public DateTimeOffset? ConsumedAt { get; set; }

    public int AttemptCount { get; set; }

    public string? CreatedByIp { get; set; }

    public string? UserAgent { get; set; }
}
