using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procraft.Domain.Entities;

namespace Procraft.Infrastructure.Persistence.Configurations;

public sealed class PaymentRequestConfiguration : IEntityTypeConfiguration<PaymentRequest>
{
    public void Configure(EntityTypeBuilder<PaymentRequest> builder)
    {
        builder.ToTable("payment_requests");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Type).IsRequired().HasConversion<string>().HasMaxLength(32);
        builder.Property(x => x.Status).IsRequired().HasConversion<string>().HasMaxLength(32);
        builder.Property(x => x.Amount).HasPrecision(12, 2);
        builder.Property(x => x.Currency).IsRequired().HasMaxLength(8);
        builder.Property(x => x.ExternalReference).HasMaxLength(200);

        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.UpdatedAt);

        builder.HasOne(x => x.Subscription)
            .WithMany(x => x.PaymentRequests)
            .HasForeignKey(x => x.SubscriptionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
