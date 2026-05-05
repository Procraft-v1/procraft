using FluentValidation;

namespace Procraft.Application.Profiles.Commands.UploadProfileAvatar;

public sealed class UploadProfileAvatarCommandValidator : AbstractValidator<UploadProfileAvatarCommand>
{
    private const long MaxAvatarSizeBytes = 5 * 1024 * 1024;
    private static readonly string[] AllowedContentTypes =
    {
        "image/jpeg",
        "image/png",
        "image/webp",
    };

    private static readonly string[] AllowedExtensions =
    {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
    };

    public UploadProfileAvatarCommandValidator()
    {
        RuleFor(x => x.FileStream).NotNull();
        RuleFor(x => x.FileName).NotEmpty().Must(HaveAllowedExtension)
            .WithMessage("Avatar must be a JPG, JPEG, PNG, or WEBP image.");
        RuleFor(x => x.ContentType).NotEmpty().Must(HaveAllowedContentType)
            .WithMessage("Avatar must be a JPG, JPEG, PNG, or WEBP image.");
        RuleFor(x => x.FileSizeBytes)
            .GreaterThan(0)
            .LessThanOrEqualTo(MaxAvatarSizeBytes)
            .WithMessage("Avatar must be 5MB or smaller.");
    }

    private static bool HaveAllowedExtension(string? fileName)
    {
        if (string.IsNullOrWhiteSpace(fileName))
        {
            return false;
        }

        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        return AllowedExtensions.Contains(extension);
    }

    private static bool HaveAllowedContentType(string? contentType) =>
        !string.IsNullOrWhiteSpace(contentType)
        && AllowedContentTypes.Contains(contentType.ToLowerInvariant());
}
