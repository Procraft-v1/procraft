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
