using Xunit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Procraft.Api.Tests;

public sealed class SanityTests
{
    [Fact]
    public void Linked_assembly_exposes_health_controller()
    {
        var type = typeof(Procraft.Api.Controllers.HealthController);
        Assert.Equal("HealthController", type.Name);
    }

    [Fact]
    public void Auth_controller_exposes_public_csrf_bootstrap_endpoint()
    {
        var method = typeof(Procraft.Api.Controllers.AuthController).GetMethod("Csrf");

        Assert.NotNull(method);
        Assert.NotNull(method!.GetCustomAttributes(typeof(AllowAnonymousAttribute), false).SingleOrDefault());

        var attribute = method.GetCustomAttributes(typeof(HttpGetAttribute), false)
            .Cast<HttpGetAttribute>()
            .SingleOrDefault();

        Assert.NotNull(attribute);
        Assert.Equal("csrf", attribute!.Template);
    }
}
