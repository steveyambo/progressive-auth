using backend.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    [HttpGet]
    public IActionResult GetDashboard()
    {
        var userName = User.GetUserName();
        var userEmail = User.GetUserEmail();
        var userRole = User.GetUserRole();
        var emailVerified =
            User.FindFirst("email_verified")?.Value == bool.TrueString;
        
        return Ok(new
        {
            message = $"Welcome back, {userName}.",
            user = new
            {
                name = userName,
                email = userEmail,
                role = userRole,
                emailVerified
            },
            stats = new
            {
                authenticationLevel = "V6 email verification",
                isProtected = true
            }
        });
    }
}
