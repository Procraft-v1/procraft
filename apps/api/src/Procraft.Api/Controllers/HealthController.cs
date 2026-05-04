using Microsoft.AspNetCore.Mvc;

namespace Procraft.Api.Controllers;

[ApiController]
[Route("api/health")]
public sealed class HealthController : ControllerBase
{
    /// <summary>Operational health reachable through the /api prefix for gateway routing symmetry.</summary>
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new { status = "Healthy" });
    }
}
