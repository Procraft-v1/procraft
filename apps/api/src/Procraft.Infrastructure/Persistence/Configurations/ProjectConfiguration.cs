using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ProjectEntity = Procraft.Domain.Entities.Project;

namespace Procraft.Infrastructure.Persistence.Configurations;

public sealed class ProjectConfiguration : IEntityTypeConfiguration<ProjectEntity>
{
    public void Configure(EntityTypeBuilder<ProjectEntity> builder)
    {
        builder.ToTable("projects");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name).IsRequired().HasMaxLength(200);
        builder.Property(x => x.Description).HasMaxLength(1000);
        builder.Property(x => x.GithubUrl).HasMaxLength(255);
        builder.Property(x => x.IsRepositoryPrivate).IsRequired();
        builder.Property(x => x.LiveUrl).HasMaxLength(255);
        builder.Property(x => x.SortOrder).IsRequired();
        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt);

        builder.HasIndex(x => x.ProfileId);
        builder.HasIndex(x => new { x.ProfileId, x.SortOrder });

        builder.HasOne(x => x.Profile)
            .WithMany(x => x.Projects)
            .HasForeignKey(x => x.ProfileId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
