using Procraft.Application.Auth.Commands.Register;
using Xunit;

namespace Procraft.Application.Tests.Auth;

public sealed class RegisterCommandValidatorTests
{
    private readonly RegisterCommandValidator _validator = new();

    [Fact]
    public void Missing_email_username_password_fail()
    {
        var result = _validator.Validate(new RegisterCommand("", "", ""));
        Assert.False(result.IsValid);
    }

    [Fact]
    public void Invalid_email_format_fails()
    {
        var result = _validator.Validate(new RegisterCommand("not-an-email", "raxim", "LongEnough1"));
        Assert.False(result.IsValid);
    }

    [Fact]
    public void Username_too_short_fails()
    {
        var result = _validator.Validate(new RegisterCommand("a@b.com", "ab", "LongEnough1"));
        Assert.False(result.IsValid);
    }

    [Fact]
    public void Username_uppercase_character_fails()
    {
        var result = _validator.Validate(new RegisterCommand("a@b.com", "Raxim_ok", "LongEnough1"));
        Assert.False(result.IsValid);
    }

    [Fact]
    public void Password_too_short_fails()
    {
        var result = _validator.Validate(new RegisterCommand("a@b.com", "raxim", "short"));
        Assert.False(result.IsValid);
    }
}
