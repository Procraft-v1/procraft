using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Procraft.Infrastructure.Persistence;

#nullable disable

namespace Procraft.Infrastructure.Persistence.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20260505120000_CreateProfileChildSectionTables")]
public partial class CreateProfileChildSectionTables : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "skills",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                ProfileId = table.Column<Guid>(type: "uuid", nullable: false),
                Name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                Level = table.Column<byte>(type: "smallint", nullable: true),
                Category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                SortOrder = table.Column<int>(type: "integer", nullable: false),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_skills", x => x.Id);
                table.ForeignKey("FK_skills_profiles_ProfileId", x => x.ProfileId, "profiles", "Id", onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "projects",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                ProfileId = table.Column<Guid>(type: "uuid", nullable: false),
                Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                GithubUrl = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                LiveUrl = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                SortOrder = table.Column<int>(type: "integer", nullable: false),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_projects", x => x.Id);
                table.ForeignKey("FK_projects_profiles_ProfileId", x => x.ProfileId, "profiles", "Id", onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "work_experiences",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                ProfileId = table.Column<Guid>(type: "uuid", nullable: false),
                Company = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                Position = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                StartDate = table.Column<DateOnly>(type: "date", nullable: false),
                EndDate = table.Column<DateOnly>(type: "date", nullable: true),
                IsCurrent = table.Column<bool>(type: "boolean", nullable: false),
                SortOrder = table.Column<int>(type: "integer", nullable: false),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_work_experiences", x => x.Id);
                table.ForeignKey("FK_work_experiences_profiles_ProfileId", x => x.ProfileId, "profiles", "Id", onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "educations",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                ProfileId = table.Column<Guid>(type: "uuid", nullable: false),
                Institution = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                Degree = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                Field = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                StartDate = table.Column<DateOnly>(type: "date", nullable: true),
                EndDate = table.Column<DateOnly>(type: "date", nullable: true),
                SortOrder = table.Column<int>(type: "integer", nullable: false),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_educations", x => x.Id);
                table.ForeignKey("FK_educations_profiles_ProfileId", x => x.ProfileId, "profiles", "Id", onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "certificates",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                ProfileId = table.Column<Guid>(type: "uuid", nullable: false),
                Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                Issuer = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                IssuedOn = table.Column<DateOnly>(type: "date", nullable: true),
                Url = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                SortOrder = table.Column<int>(type: "integer", nullable: false),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_certificates", x => x.Id);
                table.ForeignKey("FK_certificates_profiles_ProfileId", x => x.ProfileId, "profiles", "Id", onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "social_links",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                ProfileId = table.Column<Guid>(type: "uuid", nullable: false),
                Platform = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                Url = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                SortOrder = table.Column<int>(type: "integer", nullable: false),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_social_links", x => x.Id);
                table.ForeignKey("FK_social_links_profiles_ProfileId", x => x.ProfileId, "profiles", "Id", onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "custom_sections",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                ProfileId = table.Column<Guid>(type: "uuid", nullable: false),
                Title = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                Content = table.Column<string>(type: "character varying(8000)", maxLength: 8000, nullable: false),
                SortOrder = table.Column<int>(type: "integer", nullable: false),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_custom_sections", x => x.Id);
                table.ForeignKey("FK_custom_sections_profiles_ProfileId", x => x.ProfileId, "profiles", "Id", onDelete: ReferentialAction.Cascade);
            });

        CreateProfileIndexes(migrationBuilder, "skills");
        migrationBuilder.CreateIndex("IX_skills_ProfileId_Name", "skills", new[] { "ProfileId", "Name" }, unique: true);
        CreateProfileIndexes(migrationBuilder, "projects");
        CreateProfileIndexes(migrationBuilder, "work_experiences");
        CreateProfileIndexes(migrationBuilder, "educations");
        CreateProfileIndexes(migrationBuilder, "certificates");
        CreateProfileIndexes(migrationBuilder, "social_links");
        CreateProfileIndexes(migrationBuilder, "custom_sections");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "certificates");
        migrationBuilder.DropTable(name: "custom_sections");
        migrationBuilder.DropTable(name: "educations");
        migrationBuilder.DropTable(name: "projects");
        migrationBuilder.DropTable(name: "skills");
        migrationBuilder.DropTable(name: "social_links");
        migrationBuilder.DropTable(name: "work_experiences");
    }

    private static void CreateProfileIndexes(MigrationBuilder migrationBuilder, string table)
    {
        migrationBuilder.CreateIndex($"IX_{table}_ProfileId", table, "ProfileId");
        migrationBuilder.CreateIndex($"IX_{table}_ProfileId_SortOrder", table, new[] { "ProfileId", "SortOrder" });
    }
}
