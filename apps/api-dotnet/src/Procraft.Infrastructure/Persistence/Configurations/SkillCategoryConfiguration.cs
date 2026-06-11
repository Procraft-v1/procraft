using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procraft.Domain.Entities;

namespace Procraft.Infrastructure.Persistence.Configurations;

public sealed class SkillCategoryConfiguration : IEntityTypeConfiguration<SkillCategory>
{
    public void Configure(EntityTypeBuilder<SkillCategory> builder)
    {
        builder.ToTable("skill_categories");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.ProfileId).IsRequired();
        builder.Property(x => x.Name).IsRequired().HasMaxLength(80);
        builder.Property(x => x.SortOrder).IsRequired();
        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt);

        builder.HasIndex(x => x.ProfileId);
        builder.HasIndex(x => new { x.ProfileId, x.SortOrder });
        builder.HasIndex(x => new { x.ProfileId, x.Name }).IsUnique();

        builder.HasOne(x => x.Profile)
            .WithMany(x => x.SkillCategories)
            .HasForeignKey(x => x.ProfileId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
