namespace Procraft.Application.Auth.DTOs;

public sealed class PasswordResetChallengeDto
{
    public Guid ResetId { get; init; }

    public string MaskedEmail { get; init; } = string.Empty;

    public DateTimeOffset ExpiresAt { get; init; }

    public int CodeLength { get; init; } = 4;
}
