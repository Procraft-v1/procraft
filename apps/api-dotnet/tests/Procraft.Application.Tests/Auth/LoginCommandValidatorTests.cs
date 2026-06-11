using Procraft.Application.Auth.Commands.Login;
using Xunit;

namespace Procraft.Application.Tests.Auth;

public sealed class LoginCommandValidatorTests
{
    private readonly LoginCommandValidator _validator = new();

    [Fact]
    public void Requires_email_or_username_and_password()
    {
        Assert.False(_validator.Validate(new LoginCommand("", "")).IsValid);
        Assert.False(_validator.Validate(new LoginCommand("", "pw")).IsValid);
        Assert.False(_validator.Validate(new LoginCommand("raxim", "")).IsValid);
        Assert.False(_validator.Validate(new LoginCommand("   ", "pw")).IsValid);
    }

    [Fact]
    public void Minimal_valid_login_passes_validation()
    {
        var result = _validator.Validate(new LoginCommand("raxim", "password"));
        Assert.True(result.IsValid);
    }
}
