using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Procraft.Infrastructure.Persistence;

#nullable disable

namespace Procraft.Infrastructure.Persistence.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20260522110000_AddDeveloperTemplate")]
public partial class AddDeveloperTemplate : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            INSERT INTO templates ("Id", "Name", "Slug", "Description", "PreviewUrl", "IsActive", "IsPremium", "CreatedAt", "UpdatedAt")
            VALUES ('8f3e3e6c-0f8a-4d90-9b18-0d33f0bb7d05', 'Developer', 'developer', 'Dark terminal and code editor portfolio for developers.', '/templates/developer.svg', TRUE, FALSE, TIMESTAMPTZ '2026-05-22 11:00:00+00', NULL)
            ON CONFLICT ("Slug") DO UPDATE SET
                "Name" = EXCLUDED."Name",
                "Description" = EXCLUDED."Description",
                "PreviewUrl" = EXCLUDED."PreviewUrl",
                "IsActive" = TRUE,
                "UpdatedAt" = TIMESTAMPTZ '2026-05-22 11:00:00+00';
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""DELETE FROM templates WHERE "Slug" = 'developer';""");
    }
}
