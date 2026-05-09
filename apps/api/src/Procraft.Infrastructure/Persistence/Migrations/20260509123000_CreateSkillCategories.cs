using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Procraft.Infrastructure.Persistence;

#nullable disable

namespace Procraft.Infrastructure.Persistence.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20260509123000_CreateSkillCategories")]
public partial class CreateSkillCategories : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "skill_categories",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                ProfileId = table.Column<Guid>(type: "uuid", nullable: false),
                Name = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                SortOrder = table.Column<int>(type: "integer", nullable: false),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_skill_categories", x => x.Id);
                table.ForeignKey(
                    name: "FK_skill_categories_profiles_ProfileId",
                    column: x => x.ProfileId,
                    principalTable: "profiles",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_skill_categories_ProfileId",
            table: "skill_categories",
            column: "ProfileId");

        migrationBuilder.CreateIndex(
            name: "IX_skill_categories_ProfileId_Name",
            table: "skill_categories",
            columns: new[] { "ProfileId", "Name" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_skill_categories_ProfileId_SortOrder",
            table: "skill_categories",
            columns: new[] { "ProfileId", "SortOrder" });

    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "skill_categories");
    }
}
