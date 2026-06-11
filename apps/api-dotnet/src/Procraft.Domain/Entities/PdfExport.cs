namespace Procraft.Domain.Entities;

public sealed class PdfExport : BaseEntity
{
    public Guid ProfileId { get; set; }

    public Profile Profile { get; set; } = null!;

    public string Status { get; set; } = "pending";

    public string? StoragePath { get; set; }
}
