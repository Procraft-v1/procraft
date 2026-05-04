using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procraft.Domain.Entities;

namespace Procraft.Infrastructure.Persistence.Configurations;

public sealed class AnalyticsEventConfiguration : IEntityTypeConfiguration<AnalyticsEvent>
{
    public void Configure(EntityTypeBuilder<AnalyticsEvent> builder)
    {
        builder.ToTable("analytics_events");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.EventType).IsRequired().HasConversion<string>().HasMaxLength(64);
        builder.Property(x => x.Path).HasMaxLength(2048);
        builder.Property(x => x.Metadata).HasMaxLength(8000);

        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt);

        builder.HasIndex(x => new { x.ProfileId, x.CreatedAt });

        builder.HasOne(x => x.Profile)
            .WithMany(x => x.AnalyticsEvents)
            .HasForeignKey(x => x.ProfileId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
