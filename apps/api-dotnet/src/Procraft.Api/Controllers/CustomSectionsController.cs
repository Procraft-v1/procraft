using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Procraft.Application.ProfileSections.CustomSections;

namespace Procraft.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/profile/custom-sections")]
public sealed class CustomSectionsController : ControllerBase
{
    private readonly IMediator _mediator;

    public CustomSectionsController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<ActionResult> GetAsync(CancellationToken cancellationToken) =>
        Ok(await _mediator.Send(new GetCustomSectionsQuery(), cancellationToken));

    [HttpPost]
    public async Task<ActionResult> CreateAsync([FromBody] CustomSectionApiRequest request, CancellationToken cancellationToken) =>
        Ok(await _mediator.Send(new CreateCustomSectionCommand(request.Title, request.Content, request.SortOrder), cancellationToken));

    [HttpPut("{id:guid}")]
    public async Task<ActionResult> UpdateAsync([FromRoute] Guid id, [FromBody] CustomSectionApiRequest request, CancellationToken cancellationToken) =>
        Ok(await _mediator.Send(new UpdateCustomSectionCommand(id, request.Title, request.Content, request.SortOrder), cancellationToken));

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> DeleteAsync([FromRoute] Guid id, CancellationToken cancellationToken) =>
        Ok(await _mediator.Send(new DeleteCustomSectionCommand(id), cancellationToken));
}

public sealed record CustomSectionApiRequest(string Title, string Content, int? SortOrder);
