using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Procraft.Application.Templates.Queries.GetTemplates;

namespace Procraft.Api.Controllers;

[ApiController]
[Route("api/templates")]
public sealed class TemplatesController : ControllerBase
{
    private readonly IMediator _mediator;

    public TemplatesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult> GetTemplatesAsync(CancellationToken cancellationToken)
    {
        var templates = await _mediator.Send(new GetTemplatesQuery(), cancellationToken);
        return Ok(templates);
    }
}
