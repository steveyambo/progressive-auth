namespace backend.Options;

public sealed class EmailOptions
{
    public const string SectionName = "Email";

    public string SmtpHost { get; init; } = string.Empty;
    public int SmtpPort { get; init; }
    public string SenderName { get; init; } = string.Empty;
    public string SenderEmail { get; init; } = string.Empty;
    public string FrontendBaseUrl { get; init; } = string.Empty;
}