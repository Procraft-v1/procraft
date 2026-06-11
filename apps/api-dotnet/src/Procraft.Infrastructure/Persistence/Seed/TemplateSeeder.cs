using Microsoft.EntityFrameworkCore;
using Procraft.Domain.Entities;

namespace Procraft.Infrastructure.Persistence.Seed;

public static class TemplateSeeder
{
    public static async Task SeedAsync(ApplicationDbContext db, CancellationToken cancellationToken = default)
    {
        var now = DateTimeOffset.UtcNow;
        var templates = new[]
        {
            new TemplateSeed("Minimal", "minimal", "Clean typography-forward layout.", null),
            new TemplateSeed("Modern", "modern", "Card-based modern layout.", null),
            new TemplateSeed("Classic", "classic", "Traditional chronological resume.", null),
            new TemplateSeed("Editorial", "editorial", "Magazine-style editorial portfolio.", "/templates/editorial.svg"),
            new TemplateSeed("Developer", "developer", "Dark terminal and code editor portfolio for developers.", "/templates/developer.svg"),
        };

        foreach (var seed in templates)
        {
            var template = await db.Templates
                .FirstOrDefaultAsync(x => x.Slug == seed.Slug, cancellationToken);

            if (template is null)
            {
                db.Templates.Add(new Template
                {
                    Id = Guid.NewGuid(),
                    Name = seed.Name,
                    Slug = seed.Slug,
                    Description = seed.Description,
                    PreviewUrl = seed.PreviewUrl,
                    IsActive = true,
                    IsPremium = false,
                    CreatedAt = now,
                });

                continue;
            }

            template.Name = seed.Name;
            template.Description = seed.Description;
            template.PreviewUrl = seed.PreviewUrl;
            template.IsActive = true;
            template.UpdatedAt = now;
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    private sealed record TemplateSeed(string Name, string Slug, string Description, string? PreviewUrl);
}
