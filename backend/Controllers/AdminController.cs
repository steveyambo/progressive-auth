using backend.Extensions;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = nameof(UserRole.ADMIN))]
public class AdminController : ControllerBase
{
    [HttpGet]
    public IActionResult GetAdminDashboard()
    {
        return Ok(new
        {
            message = "Admin access granted.",
            user = new
            {
                name = User.GetUserName(),
                email = User.GetUserEmail(),
                role = User.GetUserRole()
            },
            admin = new
            {
                canManageUsers = true,
                authorizationLevel = "ADMIN"
            }
        });
    }
}
