using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procraft.Domain.Entities;

namespace Procraft.Infrastructure.Persistence.Configurations;

public sealed class TemplateConfiguration : IEntityTypeConfiguration<Template>
{
    public void Configure(EntityTypeBuilder<Template> builder)
    {
        builder.ToTable("templates");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name).IsRequired().HasMaxLength(160);
        builder.Property(x => x.Slug).IsRequired().HasMaxLength(160);
        builder.Property(x => x.Description).HasMaxLength(1024);
        builder.Property(x => x.PreviewUrl).HasMaxLength(2048);
        builder.Property(x => x.IsActive).IsRequired();
        builder.Property(x => x.IsPremium).IsRequired();
        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt);

        builder.HasIndex(x => x.Slug).IsUnique();
    }
}
