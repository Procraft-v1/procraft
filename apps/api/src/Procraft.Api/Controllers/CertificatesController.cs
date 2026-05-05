using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Procraft.Application.ProfileSections.Certificates;

namespace Procraft.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/profile/certificates")]
public sealed class CertificatesController : ControllerBase
{
    private readonly IMediator _mediator;

    public CertificatesController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<ActionResult> GetAsync(CancellationToken cancellationToken) =>
        Ok(await _mediator.Send(new GetCertificatesQuery(), cancellationToken));

    [HttpPost]
    public async Task<ActionResult> CreateAsync([FromBody] CertificateApiRequest request, CancellationToken cancellationToken) =>
        Ok(await _mediator.Send(new CreateCertificateCommand(request.Name, request.Issuer, request.IssuedOn, request.Url, request.SortOrder), cancellationToken));

    [HttpPut("{id:guid}")]
    public async Task<ActionResult> UpdateAsync([FromRoute] Guid id, [FromBody] CertificateApiRequest request, CancellationToken cancellationToken) =>
        Ok(await _mediator.Send(new UpdateCertificateCommand(id, request.Name, request.Issuer, request.IssuedOn, request.Url, request.SortOrder), cancellationToken));

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> DeleteAsync([FromRoute] Guid id, CancellationToken cancellationToken) =>
        Ok(await _mediator.Send(new DeleteCertificateCommand(id), cancellationToken));
}

public sealed record CertificateApiRequest(string Name, string? Issuer, DateOnly? IssuedOn, string? Url, int? SortOrder);
