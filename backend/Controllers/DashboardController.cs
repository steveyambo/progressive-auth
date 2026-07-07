using System.Security.Claims;
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
        var userName = User.FindFirstValue(ClaimTypes.Name);
        var userEmail = User.FindFirstValue(ClaimTypes.Email);

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
                authenticationLevel = "V1 basic cookie session",
                isProtected = true
            }
        });
    }
}