namespace Procraft.Domain.Entities;

public sealed class Education : BaseEntity
{
    public Guid ProfileId { get; set; }

    public Profile Profile { get; set; } = null!;

    public string Institution { get; set; } = string.Empty;

    public string? Degree { get; set; }

    public string? Field { get; set; }

    public DateOnly? StartedOn { get; set; }

    public DateOnly? EndedOn { get; set; }
}
