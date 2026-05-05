namespace Procraft.Infrastructure.Options;

public sealed class UploadsOptions
{
    public string RootPath { get; set; } = "uploads";

    public string PublicBasePath { get; set; } = "/uploads";

    public int MaxAvatarSizeMb { get; set; } = 5;

    public long MaxAvatarSizeBytes => MaxAvatarSizeMb * 1024L * 1024L;
}
