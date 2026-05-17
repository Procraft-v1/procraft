using FluentValidation;
using MediatR;
using Procraft.Application.Common.Interfaces;

namespace Procraft.Application.ProfileSections.Certificates;

public sealed record CertificateFileDto(string Url);

public sealed record UploadCertificateFileCommand(
    Stream? FileStream,
    string? FileName,
    string? ContentType,
    long FileSizeBytes) : IRequest<CertificateFileDto>;

public sealed class UploadCertificateFileCommandValidator : AbstractValidator<UploadCertificateFileCommand>
{
    public UploadCertificateFileCommandValidator()
    {
        RuleFor(x => x.FileStream).NotNull();
        RuleFor(x => x.FileName).NotEmpty().Must(CertificateFileRules.HasAllowedExtension)
            .WithMessage("Certificate file must be a PDF, JPG, JPEG, PNG, or WEBP file.");
        RuleFor(x => x.ContentType).NotEmpty().Must(CertificateFileRules.HasAllowedContentType)
            .WithMessage("Certificate file must be a PDF, JPG, JPEG, PNG, or WEBP file.");
        RuleFor(x => x.FileSizeBytes)
            .GreaterThan(0)
            .LessThanOrEqualTo(CertificateFileRules.MaxSizeBytes)
            .WithMessage("Certificate file must be 10MB or smaller.");
    }
}

public sealed class UploadCertificateFileCommandHandler : IRequestHandler<UploadCertificateFileCommand, CertificateFileDto>
{
    private const string CertificatesFolder = "certificates";

    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUserService;
    private readonly IFileStorageService _fileStorage;

    public UploadCertificateFileCommandHandler(
        IApplicationDbContext db,
        ICurrentUserService currentUserService,
        IFileStorageService fileStorage)
    {
        _db = db;
        _currentUserService = currentUserService;
        _fileStorage = fileStorage;
    }

    public async Task<CertificateFileDto> Handle(UploadCertificateFileCommand request, CancellationToken cancellationToken)
    {
        await CurrentProfile.GetIdAsync(_db, _currentUserService, cancellationToken);

        var url = await _fileStorage.SaveAsync(
            request.FileStream!,
            request.FileName!,
            request.ContentType!,
            CertificatesFolder,
            cancellationToken);

        return new CertificateFileDto(url);
    }
}
