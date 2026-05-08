using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Procraft.Infrastructure.Persistence;

#nullable disable

namespace Procraft.Infrastructure.Persistence.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20260504124500_AddTemplatesAndProfileSelection")]
public partial class AddTemplatesAndProfileSelection : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "templates",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                Name = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                Slug = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                Description = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: true),
                PreviewUrl = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                IsActive = table.Column<bool>(type: "boolean", nullable: false),
                IsPremium = table.Column<bool>(type: "boolean", nullable: false),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_templates", x => x.Id);
            });

        migrationBuilder.AddColumn<Guid>(
            name: "TemplateId",
            table: "profiles",
            type: "uuid",
            nullable: true);

        migrationBuilder.CreateIndex(
            name: "IX_templates_Slug",
            table: "templates",
            column: "Slug",
            unique: true);

        migrationBuilder.Sql("""
            INSERT INTO templates ("Id", "Name", "Slug", "Description", "PreviewUrl", "IsActive", "IsPremium", "CreatedAt", "UpdatedAt")
            VALUES
                ('8f3e3e6c-0f8a-4d90-9b18-0d33f0bb7d01', 'Minimal', 'minimal', 'Clean typography-forward layout.', NULL, TRUE, FALSE, TIMESTAMPTZ '2026-05-04 12:45:00+00', NULL),
                ('8f3e3e6c-0f8a-4d90-9b18-0d33f0bb7d02', 'Modern', 'modern', 'Card-based modern layout.', NULL, TRUE, FALSE, TIMESTAMPTZ '2026-05-04 12:45:00+00', NULL),
                ('8f3e3e6c-0f8a-4d90-9b18-0d33f0bb7d03', 'Classic', 'classic', 'Traditional chronological resume.', NULL, TRUE, FALSE, TIMESTAMPTZ '2026-05-04 12:45:00+00', NULL)
            ON CONFLICT ("Slug") DO NOTHING;
            """);

        migrationBuilder.CreateIndex(
            name: "IX_profiles_TemplateId",
            table: "profiles",
            column: "TemplateId");

        migrationBuilder.AddForeignKey(
            name: "FK_profiles_templates_TemplateId",
            table: "profiles",
            column: "TemplateId",
            principalTable: "templates",
            principalColumn: "Id",
            onDelete: ReferentialAction.SetNull);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey(name: "FK_profiles_templates_TemplateId", table: "profiles");
        migrationBuilder.DropIndex(name: "IX_profiles_TemplateId", table: "profiles");
        migrationBuilder.DropTable(name: "templates");
        migrationBuilder.DropColumn(name: "TemplateId", table: "profiles");
    }
}
