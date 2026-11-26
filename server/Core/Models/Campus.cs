using System.ComponentModel.DataAnnotations;

namespace Core.Models;

public class Campus
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;
    [Required]
    public int UniversityId { get; set; }

    /// <summary>
    /// Full street address after the 2025 administrative reform (no district level),
    /// e.g. '227 Nguyễn Văn Cừ, Phường Chợ Quán, TP.HCM'.
    /// </summary>
    [MaxLength(500)]
    public string? Address { get; set; }

    /// <summary>
    /// Address before the 2025 reform, which people still know (e.g. '227 Nguyễn Văn Cừ, Quận 5, TP.HCM').
    /// </summary>
    [MaxLength(500)]
    public string? OldAddress { get; set; }

    // Navigation properties
    public University University { get; set; } = null!;
}
