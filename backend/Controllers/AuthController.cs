using Microsoft.AspNetCore.Mvc;
using backend.Data;
using backend.Dtos;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;

namespace backend.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(AppDbContext context) : ControllerBase
{
    private readonly AppDbContext _context = context;

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        var name = request.Name.Trim();
        var email = request.Email.Trim().ToLowerInvariant();
        var password = request.Password;

        if (string.IsNullOrWhiteSpace(name) ||
            string.IsNullOrWhiteSpace(email) ||
            string.IsNullOrWhiteSpace(password))
        {
            return BadRequest(new{message = "Name, email and password are required."});
        }

        var emailAlreadyExists = await _context.Users.AnyAsync(user => user.Email == email);

        if (emailAlreadyExists)
        {
            return Conflict(new{message = "Email is already registered."});
        }

        var user = new Users
        {
            Name = name,
            Email = email,
            Password = password
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Account created successfully",
            user = new
            {
                user.Id,
                user.Name,
                user.Email,
                user.CreatedAt
            }
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var password = request.Password;

        if (string.IsNullOrWhiteSpace(email) ||
        string.IsNullOrWhiteSpace(password))
        {
            return BadRequest(new { message = "Email and password are required." });
        }

        var user = await _context.Users.FirstOrDefaultAsync(user => user.Email == email);

        if (user is null || user.Password != password)
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.Name),
            new(ClaimTypes.Email, user.Email)
        };

        var identity = new ClaimsIdentity(
            claims,
            CookieAuthenticationDefaults.AuthenticationScheme
        );

        var principal = new ClaimsPrincipal(identity);

        await HttpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            principal
        );

        return Ok(new
        {
            message = "Login successful.",
            user = new
            {
                user.Id,
                user.Name,
                user.Email,
                user.CreatedAt
            }
        });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!int.TryParse(userIdValue, out var userId))
        {
            return Unauthorized("Invalid session.");
        }

        var user = await _context.Users.FindAsync(userId);

        if (user is null)
        {
            return Unauthorized("User no longer exists.");
        }

        return Ok(new 
        {   
            user = new
            {
                user.Id,
                user.Name,
                user.Email,
                user.CreatedAt
            }
        });
    }
    
    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);

        return Ok(new {message = "Logout successful."} );
    }

}
