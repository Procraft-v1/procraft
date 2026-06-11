namespace Procraft.Application.Auth.DTOs;

public sealed class LoginChallengeDto
{
    public Guid VerificationId { get; init; }

    public string MaskedEmail { get; init; } = string.Empty;

    public DateTimeOffset ExpiresAt { get; init; }

    public int CodeLength { get; init; } = 4;
}
