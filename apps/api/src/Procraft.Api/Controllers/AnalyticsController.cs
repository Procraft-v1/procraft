using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Procraft.Application.Analytics.Commands.TrackAnalyticsEvent;
using Procraft.Application.Analytics.Queries.GetAnalyticsSummary;

namespace Procraft.Api.Controllers;

[ApiController]
[Route("api/analytics")]
public sealed class AnalyticsController : ControllerBase
{
    private readonly IMediator _mediator;

    public AnalyticsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("track")]
    [AllowAnonymous]
    public async Task<ActionResult> TrackAsync([FromBody] TrackAnalyticsRequest request, CancellationToken cancellationToken)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var userAgent = HttpContext.Request.Headers.UserAgent.ToString();
        var tracked = await _mediator.Send(
            new TrackAnalyticsEventCommand(request.ProfileId, ip, userAgent, request.Referer),
            cancellationToken);

        return Ok(tracked);
    }

    [HttpGet("summary")]
    [Authorize]
    public async Task<ActionResult> GetSummaryAsync(CancellationToken cancellationToken)
    {
        var summary = await _mediator.Send(new GetAnalyticsSummaryQuery(), cancellationToken);
        return Ok(summary);
    }
}

public sealed record TrackAnalyticsRequest(Guid ProfileId, string? Referer);
