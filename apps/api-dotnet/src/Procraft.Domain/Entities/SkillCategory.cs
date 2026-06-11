namespace Procraft.Domain.Entities;

public sealed class SkillCategory : BaseEntity
{
    public Guid ProfileId { get; set; }

    public Profile Profile { get; set; } = null!;

    public string Name { get; set; } = string.Empty;

    public int SortOrder { get; set; }
}
