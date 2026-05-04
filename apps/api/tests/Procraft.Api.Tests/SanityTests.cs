using Xunit;

namespace Procraft.Api.Tests;

public sealed class SanityTests
{
    [Fact]
    public void Linked_assembly_exposes_health_controller()
    {
        var type = typeof(Procraft.Api.Controllers.HealthController);
        Assert.Equal("HealthController", type.Name);
    }
}
