using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procraft.Domain.Entities;

namespace Procraft.Infrastructure.Persistence.Configurations;

public sealed class WorkExperienceConfiguration : IEntityTypeConfiguration<WorkExperience>
{
    public void Configure(EntityTypeBuilder<WorkExperience> builder)
    {
        builder.ToTable("work_experiences");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Company).IsRequired().HasMaxLength(200);
        builder.Property(x => x.Role).IsRequired().HasMaxLength(200);
        builder.Property(x => x.Description).HasMaxLength(4000);
        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt);

        builder.HasOne(x => x.Profile)
            .WithMany(x => x.WorkExperiences)
            .HasForeignKey(x => x.ProfileId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
