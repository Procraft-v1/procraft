using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc;
using Procraft.Application.ProfileSections.Certificates;

namespace Procraft.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/profile/certificates")]
public sealed class CertificatesController : ControllerBase
{
    private const long CertificateUploadRequestLimitBytes = 11 * 1024 * 1024;

    private readonly IMediator _mediator;

    public CertificatesController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<ActionResult> GetAsync(CancellationToken cancellationToken) =>
        Ok(await _mediator.Send(new GetCertificatesQuery(), cancellationToken));

    [HttpPost]
    [Consumes("application/json")]
    public async Task<ActionResult> CreateAsync([FromBody] CertificateApiRequest request, CancellationToken cancellationToken) =>
        Ok(await _mediator.Send(new CreateCertificateCommand(request.Name, request.Issuer, request.IssuedOn, request.Url, request.SortOrder), cancellationToken));

    [HttpPost]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(CertificateUploadRequestLimitBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = CertificateUploadRequestLimitBytes)]
    public async Task<ActionResult> CreateFormAsync([FromForm] CertificateFormApiRequest request, CancellationToken cancellationToken) =>
        Ok(await _mediator.Send(
            new CreateCertificateCommand(
                request.Name,
                request.Issuer,
                request.IssuedOn,
                request.Url,
                request.SortOrder,
                request.File?.OpenReadStream(),
                request.File?.FileName,
                request.File?.ContentType,
                request.File?.Length ?? 0),
            cancellationToken));

    [HttpPost("file")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(CertificateUploadRequestLimitBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = CertificateUploadRequestLimitBytes)]
    public async Task<ActionResult> UploadFileAsync([FromForm] UploadCertificateFileApiRequest request, CancellationToken cancellationToken) =>
        Ok(await _mediator.Send(
            new UploadCertificateFileCommand(
                request.File?.OpenReadStream(),
                request.File?.FileName,
                request.File?.ContentType,
                request.File?.Length ?? 0),
            cancellationToken));

    [HttpPut("{id:guid}")]
    [Consumes("application/json")]
    public async Task<ActionResult> UpdateAsync([FromRoute] Guid id, [FromBody] CertificateApiRequest request, CancellationToken cancellationToken) =>
        Ok(await _mediator.Send(new UpdateCertificateCommand(id, request.Name, request.Issuer, request.IssuedOn, request.Url, request.SortOrder), cancellationToken));

    [HttpPut("{id:guid}")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(CertificateUploadRequestLimitBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = CertificateUploadRequestLimitBytes)]
    public async Task<ActionResult> UpdateFormAsync([FromRoute] Guid id, [FromForm] CertificateFormApiRequest request, CancellationToken cancellationToken) =>
        Ok(await _mediator.Send(
            new UpdateCertificateCommand(
                id,
                request.Name,
                request.Issuer,
                request.IssuedOn,
                request.Url,
                request.SortOrder,
                request.File?.OpenReadStream(),
                request.File?.FileName,
                request.File?.ContentType,
                request.File?.Length ?? 0),
            cancellationToken));

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> DeleteAsync([FromRoute] Guid id, CancellationToken cancellationToken) =>
        Ok(await _mediator.Send(new DeleteCertificateCommand(id), cancellationToken));
}

public sealed record CertificateApiRequest(string Name, string? Issuer, DateOnly? IssuedOn, string? Url, int? SortOrder);

public sealed class CertificateFormApiRequest
{
    public string Name { get; init; } = string.Empty;

    public string? Issuer { get; init; }

    public DateOnly? IssuedOn { get; init; }

    public string? Url { get; init; }

    public int? SortOrder { get; init; }

    public IFormFile? File { get; init; }
}

public sealed class UploadCertificateFileApiRequest
{
    public IFormFile? File { get; init; }
}
