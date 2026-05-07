using Microsoft.EntityFrameworkCore;
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
        CancellationToken cancellationToken = default)
    {
        var user = await db.Users
            .Include(x => x.Profile)
            .FirstOrDefaultAsync(x => x.Email == Email || x.Username == Username, cancellationToken);

        var now = DateTimeOffset.UtcNow;

        if (user is null)
        {
            user = new User
            {
                Id = Guid.NewGuid(),
                Email = Email,
                Username = Username,
                PasswordHash = passwordHasher.Hash(Password),
                IsEmailConfirmed = true,
                CreatedAt = now,
            };

            await db.Users.AddAsync(user, cancellationToken);
        }
        else
        {
            user.Email = Email;
            user.Username = Username;
            user.PasswordHash = passwordHasher.Hash(Password);
            user.IsEmailConfirmed = true;
            user.UpdatedAt = now;
        }

        if (user.Profile is null)
        {
            var templateId = await db.Templates
                .Where(x => x.Slug == "minimal")
                .Select(x => (Guid?)x.Id)
                .FirstOrDefaultAsync(cancellationToken);

            user.Profile = new Profile
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                TemplateId = templateId,
                FullName = "Raximjon Tulaganov",
                Title = "Procraft User",
                CreatedAt = now,
            };
        }

        await db.SaveChangesAsync(cancellationToken);
    }
}
