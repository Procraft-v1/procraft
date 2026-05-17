using Microsoft.EntityFrameworkCore;
using Procraft.Domain.Entities;

namespace Procraft.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<User> Users { get; }

    DbSet<Profile> Profiles { get; }

    DbSet<RefreshToken> RefreshTokens { get; }

    DbSet<LoginVerificationCode> LoginVerificationCodes { get; }

    DbSet<PasswordResetCode> PasswordResetCodes { get; }

    DbSet<PendingRegistration> PendingRegistrations { get; }

    DbSet<Skill> Skills { get; }

    DbSet<SkillCategory> SkillCategories { get; }

    DbSet<Project> Projects { get; }

    DbSet<WorkExperience> WorkExperiences { get; }

    DbSet<Education> Educations { get; }

    DbSet<Certificate> Certificates { get; }

    DbSet<SocialLink> SocialLinks { get; }

    DbSet<CustomSection> CustomSections { get; }

    DbSet<Template> Templates { get; }

    DbSet<AnalyticsEvent> AnalyticsEvents { get; }

    DbSet<Subscription> Subscriptions { get; }

    DbSet<PaymentRequest> PaymentRequests { get; }

    DbSet<PdfExport> PdfExports { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
