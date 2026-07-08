namespace backend.Models;

public class Users
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.USER;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}