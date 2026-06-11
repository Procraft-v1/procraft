using MediatR;

namespace Procraft.Application.Pdf.Commands.GeneratePdf;

public sealed record GeneratePdfCommand(string? TemplateSlug = null) : IRequest<GeneratedPdfFile>;

public sealed record GeneratedPdfFile(string FileName, string ContentType, byte[] Content);
