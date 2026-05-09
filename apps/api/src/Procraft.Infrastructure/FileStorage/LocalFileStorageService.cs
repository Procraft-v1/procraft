using Microsoft.Extensions.Options;
using Procraft.Application.Common.Exceptions;
using Procraft.Application.Common.Interfaces;
using Procraft.Infrastructure.Options;

namespace Procraft.Infrastructure.FileStorage;

public sealed class LocalFileStorageService : IFileStorageService
{
    private static readonly IReadOnlyDictionary<string, string> AllowedImageTypes = new Dictionary<string, string>
    {
        [".jpg"] = "image/jpeg",
        [".jpeg"] = "image/jpeg",
        [".png"] = "image/png",
        [".webp"] = "image/webp",
    };

    private static readonly IReadOnlyDictionary<string, string> AllowedCertificateTypes = new Dictionary<string, string>
    {
        [".pdf"] = "application/pdf",
        [".jpg"] = "image/jpeg",
        [".jpeg"] = "image/jpeg",
        [".png"] = "image/png",
        [".webp"] = "image/webp",
    };

    private readonly UploadsOptions _options;

    public LocalFileStorageService(IOptions<UploadsOptions> options)
    {
        _options = options.Value;
    }

    public async Task<string> SaveAsync(
        Stream fileStream,
        string fileName,
        string contentType,
        string folder,
        CancellationToken cancellationToken = default)
    {
        ValidateFolder(folder);
        ValidateFile(fileStream, fileName, contentType, folder);

        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        var safeFileName = $"{Guid.NewGuid():N}{extension}";
        var rootPath = GetUploadsRootPath();
        var folderPath = GetSafeFolderPath(rootPath, folder);
        var targetPath = Path.Combine(folderPath, safeFileName);

        Directory.CreateDirectory(folderPath);

        await using var output = new FileStream(targetPath, FileMode.CreateNew, FileAccess.Write, FileShare.None);
        await fileStream.CopyToAsync(output, cancellationToken);

        return $"{NormalizePublicBasePath(_options.PublicBasePath)}/{folder}/{safeFileName}";
    }

    public Task DeleteAsync(string filePathOrUrl, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(filePathOrUrl))
        {
            return Task.CompletedTask;
        }

        var rootPath = GetUploadsRootPath();
        var relativePath = GetRelativePath(filePathOrUrl);
        var targetPath = Path.GetFullPath(Path.Combine(rootPath, relativePath));

        if (!IsInsideRoot(rootPath, targetPath))
        {
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["file"] = new[] { "Invalid upload path." },
            });
        }

        if (File.Exists(targetPath))
        {
            File.Delete(targetPath);
        }

        return Task.CompletedTask;
    }

    private void ValidateFile(Stream fileStream, string fileName, string contentType, string folder)
    {
        if (folder.Equals("certificates", StringComparison.OrdinalIgnoreCase))
        {
            ValidateCertificate(fileStream, fileName, contentType);
            return;
        }

        ValidateImage(fileStream, fileName, contentType);
    }

    private void ValidateImage(Stream fileStream, string fileName, string contentType)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        var normalizedContentType = contentType.ToLowerInvariant();

        if (!AllowedImageTypes.TryGetValue(extension, out var expectedContentType)
            || expectedContentType != normalizedContentType)
        {
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["file"] = new[] { "Avatar must be a JPG, JPEG, PNG, or WEBP image." },
            });
        }

        if (fileStream.CanSeek && fileStream.Length > _options.MaxAvatarSizeBytes)
        {
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["file"] = new[] { $"Avatar must be {_options.MaxAvatarSizeMb}MB or smaller." },
            });
        }
    }

    private void ValidateCertificate(Stream fileStream, string fileName, string contentType)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        var normalizedContentType = contentType.ToLowerInvariant();

        if (!AllowedCertificateTypes.TryGetValue(extension, out var expectedContentType)
            || expectedContentType != normalizedContentType)
        {
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["file"] = new[] { "Certificate file must be a PDF, JPG, JPEG, PNG, or WEBP file." },
            });
        }

        if (fileStream.CanSeek && fileStream.Length > _options.MaxCertificateSizeBytes)
        {
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["file"] = new[] { $"Certificate file must be {_options.MaxCertificateSizeMb}MB or smaller." },
            });
        }
    }

    private static void ValidateFolder(string folder)
    {
        if (string.IsNullOrWhiteSpace(folder)
            || folder.Contains("..", StringComparison.Ordinal)
            || folder.IndexOfAny(Path.GetInvalidPathChars()) >= 0
            || folder.Contains(Path.DirectorySeparatorChar)
            || folder.Contains(Path.AltDirectorySeparatorChar))
        {
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["folder"] = new[] { "Invalid upload folder." },
            });
        }
    }

    private string GetUploadsRootPath() => Path.GetFullPath(_options.RootPath);

    private static string GetSafeFolderPath(string rootPath, string folder)
    {
        var folderPath = Path.GetFullPath(Path.Combine(rootPath, folder));
        if (!IsInsideRoot(rootPath, folderPath))
        {
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["folder"] = new[] { "Invalid upload folder." },
            });
        }

        return folderPath;
    }

    private string GetRelativePath(string filePathOrUrl)
    {
        var normalizedBase = NormalizePublicBasePath(_options.PublicBasePath);
        var normalizedValue = filePathOrUrl.Replace('\\', '/');

        if (normalizedValue.StartsWith(normalizedBase, StringComparison.OrdinalIgnoreCase))
        {
            normalizedValue = normalizedValue[normalizedBase.Length..].TrimStart('/');
        }

        return normalizedValue.TrimStart('/');
    }

    private static bool IsInsideRoot(string rootPath, string targetPath)
    {
        var normalizedRoot = Path.GetFullPath(rootPath).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar)
            + Path.DirectorySeparatorChar;
        var normalizedTarget = Path.GetFullPath(targetPath);
        return normalizedTarget.StartsWith(normalizedRoot, StringComparison.OrdinalIgnoreCase);
    }

    private static string NormalizePublicBasePath(string publicBasePath)
    {
        if (string.IsNullOrWhiteSpace(publicBasePath))
        {
            return "/uploads";
        }

        return "/" + publicBasePath.Trim().Trim('/');
    }
}
