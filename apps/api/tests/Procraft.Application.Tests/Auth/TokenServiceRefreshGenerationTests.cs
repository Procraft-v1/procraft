using Microsoft.Extensions.Options;
using Procraft.Application.Common.Configuration;
using Procraft.Infrastructure.Auth;
using Xunit;

namespace Procraft.Application.Tests.Auth;

public sealed class TokenServiceRefreshGenerationTests
{
    [Fact]
    public void Generated_refresh_values_are_distinct()
    {
        var options = Options.Create(
            new JwtOptions
            {
                Secret = new string('x', 48),
                Issuer = "procraft.uz",
                Audience = "procraft.uz",
            });

        var tokens = new TokenService(options);
        var a = tokens.GenerateRefreshPlaintext();
        var b = tokens.GenerateRefreshPlaintext();
        Assert.NotEqual(a, b);
    }
}
