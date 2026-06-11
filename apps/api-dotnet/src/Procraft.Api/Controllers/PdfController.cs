using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Procraft.Application.Pdf.Commands.GeneratePdf;

namespace Procraft.Api.Controllers;

[ApiController]
[Route("api/pdf")]
[Authorize]
public sealed class PdfController : ControllerBase
{
    private readonly IMediator _mediator;

    public PdfController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("download")]
    public async Task<FileContentResult> DownloadAsync([FromQuery] string? templateSlug, CancellationToken cancellationToken)
    {
        var pdf = await _mediator.Send(new GeneratePdfCommand(templateSlug), cancellationToken);
        return File(pdf.Content, pdf.ContentType, pdf.FileName);
    }
}
