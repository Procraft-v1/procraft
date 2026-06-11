using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Procraft.Application.Common.Interfaces;
using Procraft.Domain.Entities;

namespace Procraft.Infrastructure.Persistence.Seed;

public static class StaticAccountSeeder
{
    private const string Email = "tulaganovraximjon65@gmail.com";
    private const string Username = "raximjon";
    private const string Password = "1234";

    public static async Task SeedAsync(
        ApplicationDbContext db,
        IPasswordHasher passwordHasher,
        ILogger? logger = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await SeedCoreAsync(db, passwordHasher, logger, cancellationToken);
        }
        catch (Exception ex)
        {
            logger?.LogError(
                ex,
                "Static account seeding failed. API startup will continue. Email={Email}; Username={Username}",
                Email,
                Username);
        }
    }

    private static async Task SeedCoreAsync(
        ApplicationDbContext db,
        IPasswordHasher passwordHasher,
        ILogger? logger,
        CancellationToken cancellationToken)
    {
        var normalizedEmail = Email.Trim().ToLowerInvariant();
        var normalizedUsername = Username.Trim().ToLowerInvariant();
        var now = DateTimeOffset.UtcNow;

        var matches = await db.Users
            .AsNoTracking()
            .Where(x => x.Email.ToLower() == normalizedEmail || x.Username.ToLower() == normalizedUsername)
            .Select(x => new { x.Id, x.Email, x.Username })
            .ToListAsync(cancellationToken);

        if (matches.Count > 1)
        {
            logger?.LogWarning(
                "Static account seed skipped because multiple users match the configured email or username. Email={Email}; Username={Username}; Count={Count}",
                Email,
                Username,
                matches.Count);
            return;
        }

        var existing = matches.SingleOrDefault();
        Guid userId;

        if (existing is null)
        {
            userId = Guid.NewGuid();

            await db.Users.AddAsync(
                new User
                {
                    Id = userId,
                    Email = normalizedEmail,
                    Username = normalizedUsername,
                    PasswordHash = passwordHasher.Hash(Password),
                    IsEmailConfirmed = true,
                    CreatedAt = now,
                },
                cancellationToken);

            await db.SaveChangesAsync(cancellationToken);

            logger?.LogInformation(
                "Static account created. UserId={UserId}; Email={Email}; Username={Username}",
                userId,
                normalizedEmail,
                normalizedUsername);
        }
        else
        {
            userId = existing.Id;

            var updated = await db.Users
                .Where(x => x.Id == userId)
                .ExecuteUpdateAsync(
                    setters => setters
                        .SetProperty(x => x.Email, normalizedEmail)
                        .SetProperty(x => x.Username, normalizedUsername)
                        .SetProperty(x => x.PasswordHash, passwordHasher.Hash(Password))
                        .SetProperty(x => x.IsEmailConfirmed, true)
                        .SetProperty(x => x.UpdatedAt, now),
                    cancellationToken);

            if (updated == 0)
            {
                logger?.LogWarning(
                    "Static account seed skipped because the matched user no longer exists. UserId={UserId}; Email={Email}; Username={Username}",
                    userId,
                    normalizedEmail,
                    normalizedUsername);
                return;
            }

            logger?.LogInformation(
                "Static account updated. UserId={UserId}; Email={Email}; Username={Username}",
                userId,
                normalizedEmail,
                normalizedUsername);
        }

        var hasProfile = await db.Profiles
            .AsNoTracking()
            .AnyAsync(x => x.UserId == userId, cancellationToken);

        if (hasProfile)
        {
            return;
        }

        var templateId = await db.Templates
            .AsNoTracking()
            .Where(x => x.Slug == "minimal")
            .Select(x => (Guid?)x.Id)
            .FirstOrDefaultAsync(cancellationToken);

        await db.Profiles.AddAsync(
            new Profile
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                TemplateId = templateId,
                FullName = "Raximjon Tulaganov",
                Title = "Procraft User",
                CreatedAt = now,
            },
            cancellationToken);

        await db.SaveChangesAsync(cancellationToken);

        logger?.LogInformation(
            "Static account profile created. UserId={UserId}; TemplateId={TemplateId}",
            userId,
            templateId);
    }
}
