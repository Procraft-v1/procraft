using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Procraft.Infrastructure.Persistence;

#nullable disable

namespace Procraft.Infrastructure.Persistence.Migrations;

[DbContext(typeof(ApplicationDbContext))]
partial class ApplicationDbContextModelSnapshot : ModelSnapshot
{
    protected override void BuildModel(ModelBuilder modelBuilder)
    {
        modelBuilder
            .HasAnnotation("ProductVersion", "8.0.11")
            .HasAnnotation("Relational:MaxIdentifierLength", 63);

        modelBuilder.Entity("Procraft.Domain.Entities.User", b =>
        {
            b.Property<Guid>("Id")
                .ValueGeneratedOnAdd()
                .HasColumnType("uuid");

            b.Property<DateTimeOffset>("CreatedAt")
                .HasColumnType("timestamp with time zone");

            b.Property<string>("Email")
                .IsRequired()
                .HasMaxLength(320)
                .HasColumnType("character varying(320)");

            b.Property<bool>("IsEmailConfirmed")
                .HasColumnType("boolean");

            b.Property<string>("PasswordHash")
                .IsRequired()
                .HasMaxLength(512)
                .HasColumnType("character varying(512)");

            b.Property<DateTimeOffset?>("UpdatedAt")
                .HasColumnType("timestamp with time zone");

            b.Property<string>("Username")
                .IsRequired()
                .HasMaxLength(30)
                .HasColumnType("character varying(30)");

            b.HasKey("Id");

            b.HasIndex("Email")
                .IsUnique();

            b.HasIndex("Username")
                .IsUnique();

            b.ToTable("users");
        });

        modelBuilder.Entity("Procraft.Domain.Entities.RefreshToken", b =>
        {
            b.Property<Guid>("Id")
                .ValueGeneratedOnAdd()
                .HasColumnType("uuid");

            b.Property<DateTimeOffset>("CreatedAt")
                .HasColumnType("timestamp with time zone");

            b.Property<string>("CreatedByIp")
                .HasMaxLength(64)
                .HasColumnType("character varying(64)");

            b.Property<DateTimeOffset>("ExpiresAt")
                .HasColumnType("timestamp with time zone");

            b.Property<string>("ReplacedByTokenHash")
                .HasMaxLength(64)
                .HasColumnType("character varying(64)");

            b.Property<DateTimeOffset?>("RevokedAt")
                .HasColumnType("timestamp with time zone");

            b.Property<string>("RevokedByIp")
                .HasMaxLength(64)
                .HasColumnType("character varying(64)");

            b.Property<string>("TokenHash")
                .IsRequired()
                .HasMaxLength(64)
                .HasColumnType("character varying(64)");

            b.Property<DateTimeOffset?>("UpdatedAt")
                .HasColumnType("timestamp with time zone");

            b.Property<Guid>("UserId")
                .HasColumnType("uuid");

            b.Property<string>("UserAgent")
                .HasMaxLength(512)
                .HasColumnType("character varying(512)");

            b.HasKey("Id");

            b.HasIndex("TokenHash")
                .IsUnique();

            b.HasIndex("UserId");

            b.ToTable("refresh_tokens");
        });

        modelBuilder.Entity("Procraft.Domain.Entities.Profile", b =>
        {
            b.Property<Guid>("Id")
                .ValueGeneratedOnAdd()
                .HasColumnType("uuid");

            b.Property<string>("AvatarUrl")
                .HasMaxLength(2048)
                .HasColumnType("character varying(2048)");

            b.Property<string>("Bio")
                .HasMaxLength(1000)
                .HasColumnType("character varying(1000)");

            b.Property<DateTimeOffset>("CreatedAt")
                .HasColumnType("timestamp with time zone");

            b.Property<string>("FullName")
                .IsRequired()
                .HasMaxLength(160)
                .HasColumnType("character varying(160)");

            b.Property<string>("Location")
                .HasMaxLength(160)
                .HasColumnType("character varying(160)");

            b.Property<string>("Title")
                .HasMaxLength(100)
                .HasColumnType("character varying(100)");

            b.Property<Guid?>("TemplateId")
                .HasColumnType("uuid");

            b.Property<DateTimeOffset?>("UpdatedAt")
                .HasColumnType("timestamp with time zone");

            b.Property<Guid>("UserId")
                .HasColumnType("uuid");

            b.Property<string>("Website")
                .HasMaxLength(2048)
                .HasColumnType("character varying(2048)");

            b.HasKey("Id");

            b.HasIndex("UserId")
                .IsUnique();

            b.HasIndex("TemplateId");

            b.ToTable("profiles");
        });

        modelBuilder.Entity("Procraft.Domain.Entities.Skill", b =>
        {
            b.Property<Guid>("Id")
                .ValueGeneratedOnAdd()
                .HasColumnType("uuid");

            b.Property<string>("Category")
                .HasMaxLength(50)
                .HasColumnType("character varying(50)");

            b.Property<DateTimeOffset>("CreatedAt")
                .HasColumnType("timestamp with time zone");

            b.Property<byte?>("Level")
                .HasColumnType("smallint");

            b.Property<string>("Name")
                .IsRequired()
                .HasMaxLength(120)
                .HasColumnType("character varying(120)");

            b.Property<Guid>("ProfileId")
                .HasColumnType("uuid");

            b.Property<int>("SortOrder")
                .HasColumnType("integer");

            b.Property<DateTimeOffset?>("UpdatedAt")
                .HasColumnType("timestamp with time zone");

            b.HasKey("Id");

            b.HasIndex("ProfileId");

            b.HasIndex("ProfileId", "SortOrder");

            b.HasIndex("ProfileId", "Name")
                .IsUnique();

            b.ToTable("skills");
        });

        modelBuilder.Entity("Procraft.Domain.Entities.Project", b =>
        {
            b.Property<Guid>("Id")
                .ValueGeneratedOnAdd()
                .HasColumnType("uuid");

            b.Property<DateTimeOffset>("CreatedAt")
                .HasColumnType("timestamp with time zone");

            b.Property<string>("Description")
                .HasMaxLength(1000)
                .HasColumnType("character varying(1000)");

            b.Property<string>("GithubUrl")
                .HasMaxLength(255)
                .HasColumnType("character varying(255)");

            b.Property<string>("LiveUrl")
                .HasMaxLength(255)
                .HasColumnType("character varying(255)");

            b.Property<string>("Name")
                .IsRequired()
                .HasMaxLength(200)
                .HasColumnType("character varying(200)");

            b.Property<Guid>("ProfileId")
                .HasColumnType("uuid");

            b.Property<int>("SortOrder")
                .HasColumnType("integer");

            b.Property<DateTimeOffset?>("UpdatedAt")
                .HasColumnType("timestamp with time zone");

            b.HasKey("Id");

            b.HasIndex("ProfileId");

            b.HasIndex("ProfileId", "SortOrder");

            b.ToTable("projects");
        });

        modelBuilder.Entity("Procraft.Domain.Entities.WorkExperience", b =>
        {
            b.Property<Guid>("Id")
                .ValueGeneratedOnAdd()
                .HasColumnType("uuid");

            b.Property<string>("Company")
                .IsRequired()
                .HasMaxLength(200)
                .HasColumnType("character varying(200)");

            b.Property<DateTimeOffset>("CreatedAt")
                .HasColumnType("timestamp with time zone");

            b.Property<string>("Description")
                .HasMaxLength(1000)
                .HasColumnType("character varying(1000)");

            b.Property<DateOnly?>("EndDate")
                .HasColumnType("date");

            b.Property<bool>("IsCurrent")
                .HasColumnType("boolean");

            b.Property<string>("Position")
                .IsRequired()
                .HasMaxLength(200)
                .HasColumnType("character varying(200)");

            b.Property<Guid>("ProfileId")
                .HasColumnType("uuid");

            b.Property<int>("SortOrder")
                .HasColumnType("integer");

            b.Property<DateOnly>("StartDate")
                .HasColumnType("date");

            b.Property<DateTimeOffset?>("UpdatedAt")
                .HasColumnType("timestamp with time zone");

            b.HasKey("Id");

            b.HasIndex("ProfileId");

            b.HasIndex("ProfileId", "SortOrder");

            b.ToTable("work_experiences");
        });

        modelBuilder.Entity("Procraft.Domain.Entities.Education", b =>
        {
            b.Property<Guid>("Id")
                .ValueGeneratedOnAdd()
                .HasColumnType("uuid");

            b.Property<DateTimeOffset>("CreatedAt")
                .HasColumnType("timestamp with time zone");

            b.Property<string>("Degree")
                .HasMaxLength(100)
                .HasColumnType("character varying(100)");

            b.Property<DateOnly?>("EndDate")
                .HasColumnType("date");

            b.Property<string>("Field")
                .HasMaxLength(100)
                .HasColumnType("character varying(100)");

            b.Property<string>("Institution")
                .IsRequired()
                .HasMaxLength(200)
                .HasColumnType("character varying(200)");

            b.Property<Guid>("ProfileId")
                .HasColumnType("uuid");

            b.Property<int>("SortOrder")
                .HasColumnType("integer");

            b.Property<DateOnly?>("StartDate")
                .HasColumnType("date");

            b.Property<DateTimeOffset?>("UpdatedAt")
                .HasColumnType("timestamp with time zone");

            b.HasKey("Id");

            b.HasIndex("ProfileId");

            b.HasIndex("ProfileId", "SortOrder");

            b.ToTable("educations");
        });

        modelBuilder.Entity("Procraft.Domain.Entities.Certificate", b =>
        {
            b.Property<Guid>("Id")
                .ValueGeneratedOnAdd()
                .HasColumnType("uuid");

            b.Property<DateTimeOffset>("CreatedAt")
                .HasColumnType("timestamp with time zone");

            b.Property<string>("Issuer")
                .HasMaxLength(100)
                .HasColumnType("character varying(100)");

            b.Property<DateOnly?>("IssuedOn")
                .HasColumnType("date");

            b.Property<string>("Name")
                .IsRequired()
                .HasMaxLength(200)
                .HasColumnType("character varying(200)");

            b.Property<Guid>("ProfileId")
                .HasColumnType("uuid");

            b.Property<int>("SortOrder")
                .HasColumnType("integer");

            b.Property<DateTimeOffset?>("UpdatedAt")
                .HasColumnType("timestamp with time zone");

            b.Property<string>("Url")
                .HasMaxLength(255)
                .HasColumnType("character varying(255)");

            b.HasKey("Id");

            b.HasIndex("ProfileId");

            b.HasIndex("ProfileId", "SortOrder");

            b.ToTable("certificates");
        });

        modelBuilder.Entity("Procraft.Domain.Entities.SocialLink", b =>
        {
            b.Property<Guid>("Id")
                .ValueGeneratedOnAdd()
                .HasColumnType("uuid");

            b.Property<DateTimeOffset>("CreatedAt")
                .HasColumnType("timestamp with time zone");

            b.Property<string>("Platform")
                .IsRequired()
                .HasMaxLength(100)
                .HasColumnType("character varying(100)");

            b.Property<Guid>("ProfileId")
                .HasColumnType("uuid");

            b.Property<int>("SortOrder")
                .HasColumnType("integer");

            b.Property<DateTimeOffset?>("UpdatedAt")
                .HasColumnType("timestamp with time zone");

            b.Property<string>("Url")
                .IsRequired()
                .HasMaxLength(255)
                .HasColumnType("character varying(255)");

            b.HasKey("Id");

            b.HasIndex("ProfileId");

            b.HasIndex("ProfileId", "SortOrder");

            b.ToTable("social_links");
        });

        modelBuilder.Entity("Procraft.Domain.Entities.CustomSection", b =>
        {
            b.Property<Guid>("Id")
                .ValueGeneratedOnAdd()
                .HasColumnType("uuid");

            b.Property<string>("Content")
                .IsRequired()
                .HasMaxLength(8000)
                .HasColumnType("character varying(8000)");

            b.Property<DateTimeOffset>("CreatedAt")
                .HasColumnType("timestamp with time zone");

            b.Property<Guid>("ProfileId")
                .HasColumnType("uuid");

            b.Property<int>("SortOrder")
                .HasColumnType("integer");

            b.Property<string>("Title")
                .IsRequired()
                .HasMaxLength(160)
                .HasColumnType("character varying(160)");

            b.Property<DateTimeOffset?>("UpdatedAt")
                .HasColumnType("timestamp with time zone");

            b.HasKey("Id");

            b.HasIndex("ProfileId");

            b.HasIndex("ProfileId", "SortOrder");

            b.ToTable("custom_sections");
        });

        modelBuilder.Entity("Procraft.Domain.Entities.Template", b =>
        {
            b.Property<Guid>("Id")
                .ValueGeneratedOnAdd()
                .HasColumnType("uuid");

            b.Property<DateTimeOffset>("CreatedAt")
                .HasColumnType("timestamp with time zone");

            b.Property<string>("Description")
                .HasMaxLength(1024)
                .HasColumnType("character varying(1024)");

            b.Property<bool>("IsActive")
                .HasColumnType("boolean");

            b.Property<bool>("IsPremium")
                .HasColumnType("boolean");

            b.Property<string>("Name")
                .IsRequired()
                .HasMaxLength(160)
                .HasColumnType("character varying(160)");

            b.Property<string>("PreviewUrl")
                .HasMaxLength(2048)
                .HasColumnType("character varying(2048)");

            b.Property<string>("Slug")
                .IsRequired()
                .HasMaxLength(160)
                .HasColumnType("character varying(160)");

            b.Property<DateTimeOffset?>("UpdatedAt")
                .HasColumnType("timestamp with time zone");

            b.HasKey("Id");

            b.HasIndex("Slug")
                .IsUnique();

            b.ToTable("templates");
        });

        modelBuilder.Entity("Procraft.Domain.Entities.RefreshToken", b =>
        {
            b.HasOne("Procraft.Domain.Entities.User", "User")
                .WithMany("RefreshTokens")
                .HasForeignKey("UserId")
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();

            b.Navigation("User");
        });

        modelBuilder.Entity("Procraft.Domain.Entities.Profile", b =>
        {
            b.HasOne("Procraft.Domain.Entities.Template", "Template")
                .WithMany("Profiles")
                .HasForeignKey("TemplateId")
                .OnDelete(DeleteBehavior.SetNull);

            b.HasOne("Procraft.Domain.Entities.User", "User")
                .WithOne("Profile")
                .HasForeignKey("Procraft.Domain.Entities.Profile", "UserId")
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();

            b.Navigation("Template");

            b.Navigation("User");
        });

        modelBuilder.Entity("Procraft.Domain.Entities.Skill", b =>
        {
            b.HasOne("Procraft.Domain.Entities.Profile", "Profile")
                .WithMany("Skills")
                .HasForeignKey("ProfileId")
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();

            b.Navigation("Profile");
        });

        modelBuilder.Entity("Procraft.Domain.Entities.Project", b =>
        {
            b.HasOne("Procraft.Domain.Entities.Profile", "Profile")
                .WithMany("Projects")
                .HasForeignKey("ProfileId")
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();

            b.Navigation("Profile");
        });

        modelBuilder.Entity("Procraft.Domain.Entities.WorkExperience", b =>
        {
            b.HasOne("Procraft.Domain.Entities.Profile", "Profile")
                .WithMany("WorkExperiences")
                .HasForeignKey("ProfileId")
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();

            b.Navigation("Profile");
        });

        modelBuilder.Entity("Procraft.Domain.Entities.Education", b =>
        {
            b.HasOne("Procraft.Domain.Entities.Profile", "Profile")
                .WithMany("Educations")
                .HasForeignKey("ProfileId")
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();

            b.Navigation("Profile");
        });

        modelBuilder.Entity("Procraft.Domain.Entities.Certificate", b =>
        {
            b.HasOne("Procraft.Domain.Entities.Profile", "Profile")
                .WithMany("Certificates")
                .HasForeignKey("ProfileId")
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();

            b.Navigation("Profile");
        });

        modelBuilder.Entity("Procraft.Domain.Entities.SocialLink", b =>
        {
            b.HasOne("Procraft.Domain.Entities.Profile", "Profile")
                .WithMany("SocialLinks")
                .HasForeignKey("ProfileId")
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();

            b.Navigation("Profile");
        });

        modelBuilder.Entity("Procraft.Domain.Entities.CustomSection", b =>
        {
            b.HasOne("Procraft.Domain.Entities.Profile", "Profile")
                .WithMany("CustomSections")
                .HasForeignKey("ProfileId")
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();

            b.Navigation("Profile");
        });

        modelBuilder.Entity("Procraft.Domain.Entities.Profile", b =>
        {
            b.Navigation("Certificates");

            b.Navigation("CustomSections");

            b.Navigation("Educations");

            b.Navigation("Projects");

            b.Navigation("Skills");

            b.Navigation("SocialLinks");

            b.Navigation("WorkExperiences");
        });

        modelBuilder.Entity("Procraft.Domain.Entities.Template", b =>
        {
            b.Navigation("Profiles");
        });

        modelBuilder.Entity("Procraft.Domain.Entities.User", b =>
        {
            b.Navigation("Profile");

            b.Navigation("RefreshTokens");
        });
    }
}
