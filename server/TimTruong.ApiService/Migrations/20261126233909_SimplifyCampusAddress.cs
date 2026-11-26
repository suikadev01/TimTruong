using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TimTruong.ApiService.Migrations
{
    /// <inheritdoc />
    public partial class SimplifyCampusAddress : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "City",
                table: "Campuses");

            migrationBuilder.DropColumn(
                name: "District",
                table: "Campuses");

            migrationBuilder.DropColumn(
                name: "OldCity",
                table: "Campuses");

            migrationBuilder.DropColumn(
                name: "OldDistrict",
                table: "Campuses");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "City",
                table: "Campuses",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "District",
                table: "Campuses",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OldCity",
                table: "Campuses",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OldDistrict",
                table: "Campuses",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);
        }
    }
}
