using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procraft.Domain.Entities;

namespace Procraft.Infrastructure.Persistence.Configurations;

public sealed class CustomSectionConfiguration : IEntityTypeConfiguration<CustomSection>
{
    public void Configure(EntityTypeBuilder<CustomSection> builder)
    {
        builder.ToTable("custom_sections");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Title).IsRequired().HasMaxLength(160);
        builder.Property(x => x.Content).IsRequired().HasMaxLength(8000);
        builder.Property(x => x.SortOrder).IsRequired();
        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt);

        builder.HasIndex(x => x.ProfileId);
        builder.HasIndex(x => new { x.ProfileId, x.SortOrder });

        builder.HasOne(x => x.Profile)
            .WithMany(x => x.CustomSections)
            .HasForeignKey(x => x.ProfileId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
