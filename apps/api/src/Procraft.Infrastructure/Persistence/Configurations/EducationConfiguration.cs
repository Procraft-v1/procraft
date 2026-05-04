using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procraft.Domain.Entities;

namespace Procraft.Infrastructure.Persistence.Configurations;

public sealed class EducationConfiguration : IEntityTypeConfiguration<Education>
{
    public void Configure(EntityTypeBuilder<Education> builder)
    {
        builder.ToTable("educations");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Institution).IsRequired().HasMaxLength(200);
        builder.Property(x => x.Degree).HasMaxLength(200);
        builder.Property(x => x.Field).HasMaxLength(200);
        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt);

        builder.HasOne(x => x.Profile)
            .WithMany(x => x.Educations)
            .HasForeignKey(x => x.ProfileId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
