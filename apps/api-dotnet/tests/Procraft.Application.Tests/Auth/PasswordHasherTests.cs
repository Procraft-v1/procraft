using Procraft.Infrastructure.Auth;
using Xunit;

namespace Procraft.Application.Tests.Auth;

public sealed class PasswordHasherTests
{
    [Fact]
    public void Verify_accepts_round_trip_hash()
    {
        var hasher = new PasswordHasher();
        var hash = hasher.Hash("StrongPassword123");
        Assert.True(hasher.Verify("StrongPassword123", hash));
        Assert.False(hasher.Verify("WrongPassword", hash));
    }
}
