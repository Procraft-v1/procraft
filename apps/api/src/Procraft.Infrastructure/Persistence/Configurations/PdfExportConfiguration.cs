using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procraft.Domain.Entities;

namespace Procraft.Infrastructure.Persistence.Configurations;

public sealed class PdfExportConfiguration : IEntityTypeConfiguration<PdfExport>
{
    public void Configure(EntityTypeBuilder<PdfExport> builder)
    {
        builder.ToTable("pdf_exports");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Status).IsRequired().HasMaxLength(64);
        builder.Property(x => x.StoragePath).HasMaxLength(1024);
        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt);

        builder.HasOne(x => x.Profile)
            .WithMany(x => x.PdfExports)
            .HasForeignKey(x => x.ProfileId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
