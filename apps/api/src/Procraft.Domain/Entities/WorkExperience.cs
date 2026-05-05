namespace Procraft.Domain.Entities;

public sealed class WorkExperience : BaseEntity
{
    public Guid ProfileId { get; set; }

    public Profile Profile { get; set; } = null!;

    public string Company { get; set; } = string.Empty;

    public string Position { get; set; } = string.Empty;

    public string? Description { get; set; }

    public DateOnly StartDate { get; set; }

    public DateOnly? EndDate { get; set; }

    public bool IsCurrent { get; set; }

    public int SortOrder { get; set; }
}
