using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Procraft.Infrastructure.Persistence;

#nullable disable

namespace Procraft.Infrastructure.Persistence.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20260509131500_AddEducationType")]
public partial class AddEducationType : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "EducationType",
            table: "educations",
            type: "character varying(30)",
            maxLength: 30,
            nullable: false,
            defaultValue: "formal");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "EducationType",
            table: "educations");
    }
}
