using System.ComponentModel.DataAnnotations;

namespace TimTruong.ApiService.Options;

/// <summary>
/// Public object storage (Cloudflare R2 bucket behind a custom domain).
/// The API never talks to R2: images are uploaded by etl/etl_images.py, the DB stores
/// object keys, and the API only turns a key into a public URL.
/// </summary>
public class StorageOptions
{
    public const string SectionName = "Storage";

    /// <summary>
    /// Base URL of the bucket's custom domain, without a trailing slash
    /// (e.g. "https://img.timtruong.app").
    /// </summary>
    [Required]
    [Url]
    public string PublicBaseUrl { get; set; } = string.Empty;
}
