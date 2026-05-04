using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procraft.Domain.Entities;

namespace Procraft.Infrastructure.Persistence.Configurations;

public sealed class ProfileConfiguration : IEntityTypeConfiguration<Profile>
{
    public void Configure(EntityTypeBuilder<Profile> builder)
    {
        builder.ToTable("profiles");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.UserId).IsRequired();
        builder.Property(x => x.TemplateId);
        builder.Property(x => x.FullName).IsRequired().HasMaxLength(160);
        builder.Property(x => x.Title).HasMaxLength(100);
        builder.Property(x => x.Bio).HasMaxLength(1000);
        builder.Property(x => x.Location).HasMaxLength(160);
        builder.Property(x => x.Website).HasMaxLength(2048);
        builder.Property(x => x.AvatarUrl).HasMaxLength(2048);

        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt);

        builder.HasIndex(x => x.UserId).IsUnique();
        builder.HasIndex(x => x.TemplateId);

        builder.HasOne(x => x.User)
            .WithOne(x => x.Profile)
            .HasForeignKey<Profile>(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Template)
            .WithMany(x => x.Profiles)
            .HasForeignKey(x => x.TemplateId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
