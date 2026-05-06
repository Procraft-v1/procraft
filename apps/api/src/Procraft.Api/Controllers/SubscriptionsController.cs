using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Procraft.Application.Subscriptions.Queries.GetMySubscription;

namespace Procraft.Api.Controllers;

[ApiController]
[Route("api/subscriptions")]
[Authorize]
public sealed class SubscriptionsController : ControllerBase
{
    private readonly IMediator _mediator;

    public SubscriptionsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("me")]
    public async Task<ActionResult> GetMeAsync(CancellationToken cancellationToken)
    {
        var subscription = await _mediator.Send(new GetMySubscriptionQuery(), cancellationToken);
        return Ok(subscription);
    }
}
