using System.ComponentModel.DataAnnotations;

namespace Core.Models;

/// <summary>
/// A photo of a dormitory (KTX), stored in Cloudflare R2.
/// Loaded by etl/etl_images.py; the API only builds the public URL from <see cref="Key"/>.
/// </summary>
public class DormitoryImage
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int DormitoryId { get; set; }

    /// <summary>
    /// R2 object key (e.g. 'images/3f2a9c1b7d4e5a60.webp'). Public URL = Storage:PublicBaseUrl + '/' + Key.
    /// </summary>
    [Required]
    [MaxLength(200)]
    public string Key { get; set; } = string.Empty;

    [MaxLength(300)]
    public string? Caption { get; set; }

    /// <summary>
    /// Original URL the photo was taken from (attribution).
    /// </summary>
    [Required]
    [MaxLength(1000)]
    public string SourceUrl { get; set; } = string.Empty;

    /// <summary>
    /// Display order; the ETL sets it from the row order in the CSV.
    /// </summary>
    public int SortOrder { get; set; }

    // Navigation properties
    public Dormitory Dormitory { get; set; } = null!;
}
