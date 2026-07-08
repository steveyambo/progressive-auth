using System.Security.Claims;

namespace backend.Extensions;

public static class CurrentUserExtensions
{
    public static int? GetUserId(this ClaimsPrincipal user)
    {
        var userIdValue = user.FindFirstValue(ClaimTypes.NameIdentifier);

        return int.TryParse(userIdValue, out var userId)
            ? userId
            : null;
    }

    public static string? GetUserName(this ClaimsPrincipal user)
    {
        return user.FindFirstValue(ClaimTypes.Name);
    }

    public static string? GetUserEmail(this ClaimsPrincipal user)
    {
        return user.FindFirstValue(ClaimTypes.Email);
    }
}