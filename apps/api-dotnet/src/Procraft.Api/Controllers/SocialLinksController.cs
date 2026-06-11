using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Procraft.Application.ProfileSections.SocialLinks;

namespace Procraft.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/profile/social-links")]
public sealed class SocialLinksController : ControllerBase
{
    private readonly IMediator _mediator;

    public SocialLinksController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<ActionResult> GetAsync(CancellationToken cancellationToken) =>
        Ok(await _mediator.Send(new GetSocialLinksQuery(), cancellationToken));

    [HttpPost]
    public async Task<ActionResult> CreateAsync([FromBody] SocialLinkApiRequest request, CancellationToken cancellationToken) =>
        Ok(await _mediator.Send(new CreateSocialLinkCommand(request.Platform, request.Url, request.SortOrder), cancellationToken));

    [HttpPut("{id:guid}")]
    public async Task<ActionResult> UpdateAsync([FromRoute] Guid id, [FromBody] SocialLinkApiRequest request, CancellationToken cancellationToken) =>
        Ok(await _mediator.Send(new UpdateSocialLinkCommand(id, request.Platform, request.Url, request.SortOrder), cancellationToken));

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> DeleteAsync([FromRoute] Guid id, CancellationToken cancellationToken) =>
        Ok(await _mediator.Send(new DeleteSocialLinkCommand(id), cancellationToken));
}

public sealed record SocialLinkApiRequest(string Platform, string Url, int? SortOrder);
