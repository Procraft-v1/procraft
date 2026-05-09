using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Procraft.Infrastructure.Persistence;

#nullable disable

namespace Procraft.Infrastructure.Persistence.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20260509130000_AddWorkExperienceType")]
public partial class AddWorkExperienceType : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "ExperienceType",
            table: "work_experiences",
            type: "character varying(30)",
            maxLength: 30,
            nullable: false,
            defaultValue: "work");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "ExperienceType",
            table: "work_experiences");
    }
}
