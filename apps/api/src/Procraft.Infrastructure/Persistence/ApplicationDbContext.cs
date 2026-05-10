using Microsoft.EntityFrameworkCore;
using Procraft.Application.Common.Interfaces;
using Procraft.Domain.Entities;

namespace Procraft.Infrastructure.Persistence;

public sealed class ApplicationDbContext : DbContext, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();

    public DbSet<Profile> Profiles => Set<Profile>();

    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    public DbSet<LoginVerificationCode> LoginVerificationCodes => Set<LoginVerificationCode>();

    public DbSet<PasswordResetCode> PasswordResetCodes => Set<PasswordResetCode>();

    public DbSet<Skill> Skills => Set<Skill>();

    public DbSet<SkillCategory> SkillCategories => Set<SkillCategory>();

    public DbSet<Project> Projects => Set<Project>();

    public DbSet<WorkExperience> WorkExperiences => Set<WorkExperience>();

    public DbSet<Education> Educations => Set<Education>();

    public DbSet<Certificate> Certificates => Set<Certificate>();

    public DbSet<SocialLink> SocialLinks => Set<SocialLink>();

    public DbSet<CustomSection> CustomSections => Set<CustomSection>();

    public DbSet<Template> Templates => Set<Template>();

    public DbSet<AnalyticsEvent> AnalyticsEvents => Set<AnalyticsEvent>();

    public DbSet<Subscription> Subscriptions => Set<Subscription>();

    public DbSet<PaymentRequest> PaymentRequests => Set<PaymentRequest>();

    public DbSet<PdfExport> PdfExports => Set<PdfExport>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
