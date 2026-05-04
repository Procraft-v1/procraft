using Microsoft.AspNetCore.Identity;
using Procraft.Application.Common.Interfaces;

namespace Procraft.Infrastructure.Auth;

public sealed class PasswordHasher : IPasswordHasher
{
    private readonly Microsoft.AspNetCore.Identity.PasswordHasher<object> _hasher = new();
    private static readonly object UserMarker = new();

    public string Hash(string password) => _hasher.HashPassword(UserMarker, password);

    public bool Verify(string password, string hashedPassword)
    {
        var result = _hasher.VerifyHashedPassword(UserMarker, hashedPassword, password);
        return result is PasswordVerificationResult.Success or PasswordVerificationResult.SuccessRehashNeeded;
    }
}
