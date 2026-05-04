namespace Procraft.Domain.Entities;

public sealed class WorkExperience : BaseEntity
{
    public Guid ProfileId { get; set; }

    public Profile Profile { get; set; } = null!;

    public string Company { get; set; } = string.Empty;

    public string Role { get; set; } = string.Empty;

    public string? Description { get; set; }

    public DateOnly? StartedOn { get; set; }

    public DateOnly? EndedOn { get; set; }
}
