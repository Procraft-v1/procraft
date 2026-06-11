namespace Procraft.Domain.Entities;

public sealed class Education : BaseEntity
{
    public Guid ProfileId { get; set; }

    public Profile Profile { get; set; } = null!;

    public string Institution { get; set; } = string.Empty;

    public string EducationType { get; set; } = "formal";

    public string? Degree { get; set; }

    public string? Field { get; set; }

    public DateOnly? StartDate { get; set; }

    public DateOnly? EndDate { get; set; }

    public int SortOrder { get; set; }
}
