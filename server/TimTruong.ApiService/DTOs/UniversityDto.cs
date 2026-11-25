namespace TimTruong.ApiService.DTOs;

/// <summary>
/// University data transfer object for API responses
/// </summary>
public record UniversityDto
{
    public int Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Slug { get; init; }
    public string? ShortName { get; init; }
    public string? EnglishName { get; init; }
    public string? OldName { get; init; }
    public string Code { get; init; } = string.Empty;
    public string Type { get; init; } = string.Empty; // "Public" or "Private"
    public string? ImageUrl { get; init; }
    public bool? IsFinanciallyAutonomous { get; init; }
    public bool? HasDormitory { get; init; }
    public List<CampusLocationDto> Campuses { get; init; } = new();
    public List<DormitoryDto> Dormitories { get; init; } = new();
    public List<RankingDto> Rankings { get; init; } = new();
    /// <summary>Facility photos; only filled by the detail endpoints (by id / slug).</summary>
    public List<UniversityImageDto> Images { get; init; } = new();
}

public record CampusLocationDto(string City, string? District);

public record DormitoryDto(
    string Name,
    string? Address,
    string? Note,
    string? RegistrationUrl,
    List<ImageDto> Images);

/// <param name="Url">Public URL of the photo (R2 custom domain).</param>
/// <param name="SourceUrl">Original URL the photo was taken from, for attribution.</param>
public record ImageDto(string Url, string? Caption, string SourceUrl);

/// <param name="CampusName">Campus shown in the photo; null = general photo of the university.</param>
public record UniversityImageDto(string Url, string? Caption, string SourceUrl, string? CampusName);

public record RankingDto(string System, int Year, int RankFrom, int? RankTo, string? SourceUrl);
