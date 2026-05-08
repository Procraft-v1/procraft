using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Procraft.Infrastructure.Persistence;

#nullable disable

namespace Procraft.Infrastructure.Persistence.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20260506120000_CreateOperationalTables")]
public partial class CreateOperationalTables : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "subscriptions",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                UserId = table.Column<Guid>(type: "uuid", nullable: false),
                PlanKey = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                CurrentPeriodEnd = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_subscriptions", x => x.Id);
                table.ForeignKey("FK_subscriptions_users_UserId", x => x.UserId, "users", "Id", onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "analytics_events",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                ProfileId = table.Column<Guid>(type: "uuid", nullable: true),
                EventType = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                Path = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                Metadata = table.Column<string>(type: "character varying(8000)", maxLength: 8000, nullable: true),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_analytics_events", x => x.Id);
                table.ForeignKey("FK_analytics_events_profiles_ProfileId", x => x.ProfileId, "profiles", "Id", onDelete: ReferentialAction.SetNull);
            });

        migrationBuilder.CreateTable(
            name: "pdf_exports",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                ProfileId = table.Column<Guid>(type: "uuid", nullable: false),
                Status = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                StoragePath = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: true),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_pdf_exports", x => x.Id);
                table.ForeignKey("FK_pdf_exports_profiles_ProfileId", x => x.ProfileId, "profiles", "Id", onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "payment_requests",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                SubscriptionId = table.Column<Guid>(type: "uuid", nullable: false),
                Type = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                Amount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                Currency = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false),
                ExternalReference = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_payment_requests", x => x.Id);
                table.ForeignKey("FK_payment_requests_subscriptions_SubscriptionId", x => x.SubscriptionId, "subscriptions", "Id", onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex("IX_subscriptions_UserId", "subscriptions", "UserId");
        migrationBuilder.CreateIndex("IX_analytics_events_ProfileId_CreatedAt", "analytics_events", new[] { "ProfileId", "CreatedAt" });
        migrationBuilder.CreateIndex("IX_pdf_exports_ProfileId", "pdf_exports", "ProfileId");
        migrationBuilder.CreateIndex("IX_payment_requests_SubscriptionId", "payment_requests", "SubscriptionId");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "analytics_events");
        migrationBuilder.DropTable(name: "payment_requests");
        migrationBuilder.DropTable(name: "pdf_exports");
        migrationBuilder.DropTable(name: "subscriptions");
    }
}
