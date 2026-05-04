using Microsoft.Extensions.Options;
using Procraft.Application.Common.Interfaces;
using Procraft.Infrastructure.Options;

namespace Procraft.Infrastructure.FileStorage;

public sealed class LocalFileStorageService : IFileStorageService
{
    private readonly UploadsOptions _options;

    public LocalFileStorageService(IOptions<UploadsOptions> options)
    {
        _options = options.Value;
    }

    public Task<string> SaveAsync(Stream content, string fileName, string contentType, CancellationToken cancellationToken = default)
    {
        Directory.CreateDirectory(_options.RootPath);
        var safeName = $"{Guid.NewGuid():N}-{Path.GetFileName(fileName)}";
        var path = Path.Combine(_options.RootPath, safeName);

        using (var fs = File.Create(path))
        {
            content.CopyTo(fs);
        }

        return Task.FromResult(path);
    }
}
