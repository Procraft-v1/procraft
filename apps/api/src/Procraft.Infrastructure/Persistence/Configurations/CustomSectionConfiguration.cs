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
        builder.Property(x => x.Body).IsRequired().HasMaxLength(8000);
        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt);

        builder.HasOne(x => x.Profile)
            .WithMany(x => x.CustomSections)
            .HasForeignKey(x => x.ProfileId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
