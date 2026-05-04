using Microsoft.EntityFrameworkCore;
using Procraft.Domain.Entities;

namespace Procraft.Infrastructure.Persistence.Seed;

public static class TemplateSeeder
{
    public static async Task SeedAsync(ApplicationDbContext db, CancellationToken cancellationToken = default)
    {
        if (await db.Templates.AnyAsync(cancellationToken))
        {
            return;
        }

        var now = DateTimeOffset.UtcNow;
        db.Templates.AddRange(
            new Template
            {
                Id = Guid.NewGuid(),
                Name = "Minimal",
                Slug = "minimal",
                Description = "Clean typography-forward layout.",
                PreviewUrl = null,
                IsActive = true,
                IsPremium = false,
                CreatedAt = now,
            },
            new Template
            {
                Id = Guid.NewGuid(),
                Name = "Modern",
                Slug = "modern",
                Description = "Card-based modern layout.",
                PreviewUrl = null,
                IsActive = true,
                IsPremium = false,
                CreatedAt = now,
            },
            new Template
            {
                Id = Guid.NewGuid(),
                Name = "Classic",
                Slug = "classic",
                Description = "Traditional chronological resume.",
                PreviewUrl = null,
                IsActive = true,
                IsPremium = false,
                CreatedAt = now,
            });

        await db.SaveChangesAsync(cancellationToken);
    }
}
