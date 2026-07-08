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

        return Ok(new
        {
            message = $"Welcome back, {userName}.",
            user = new
            {
                name = userName,
                email = userEmail
            },
            stats = new
            {
                authenticationLevel = "V4 authentication middleware pipeline",
                isProtected = true
            }
        });
    }
}
