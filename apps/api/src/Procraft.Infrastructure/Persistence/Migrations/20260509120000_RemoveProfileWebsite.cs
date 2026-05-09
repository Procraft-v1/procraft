using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Procraft.Infrastructure.Persistence;

#nullable disable

namespace Procraft.Infrastructure.Persistence.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20260509120000_RemoveProfileWebsite")]
public partial class RemoveProfileWebsite : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "Website",
            table: "profiles");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "Website",
            table: "profiles",
            type: "character varying(2048)",
            maxLength: 2048,
            nullable: true);
    }
}
