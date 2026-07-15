using Microsoft.AspNetCore.Mvc;
using backend.Data;
using backend.Dtos;
using backend.Extensions;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using backend.Options;
using backend.Services;
using Microsoft.Extensions.Options;
using System.Security.Cryptography;
using System.Net;
using System.Net.Mail;

namespace backend.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(
    AppDbContext context,
    IPasswordHasher<Users> passwordHasher,
    IEmailSender emailSender,
    IOptions<EmailOptions> emailOptions,
    ILogger<AuthController> logger
    ) : ControllerBase
{
    private readonly AppDbContext _context = context;
    private readonly IPasswordHasher<Users> _passwordHasher = passwordHasher;

    private readonly IEmailSender _emailSender = emailSender;
    private readonly EmailOptions _emailOptions = emailOptions.Value;
    private readonly ILogger<AuthController> _logger = logger;



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
            return BadRequest(new { message = "Name, email and password are required." });
        }

        var emailAlreadyExists = await _context.Users.AnyAsync(user => user.Email == email);

        if (emailAlreadyExists)
        {
            return Conflict(new { message = "Email is already registered." });
        }

        var verificationToken = Convert.ToHexString(
            RandomNumberGenerator.GetBytes(32));

        var user = new Users
        {
            Name = name,
            Email = email,
            EmailVerified = false,
            EmailVerificationToken = verificationToken,
            EmailVerificationTokenExpiresAt = DateTime.UtcNow.AddHours(24)
        };
        user.PasswordHash = _passwordHasher.HashPassword(user, password);


        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var verificationEmailSent = true;

        try
        {
            await SendVerificationEmailAsync(
                user,
                verificationToken,
                HttpContext.RequestAborted);
        }
        catch (SmtpException exception)
        {
            verificationEmailSent = false;

            _logger.LogWarning(
                exception,
                "Verification email could not be sent for user {UserId}.",
                user.Id);
        }

        return StatusCode(
            StatusCodes.Status201Created,
            new
            {
                message = verificationEmailSent
                    ? "Account created successfully. Check your email."
                    : "Account created, but the verification email could not be sent.",
                verificationEmailSent,
                user = new
                {
                    user.Id,
                    user.Name,
                    user.Email,
                    Role = user.Role.ToString(),
                    user.EmailVerified,
                    user.CreatedAt
                }
            }
        );
    }

    [AllowAnonymous]
    [HttpPost("verify-email")]
    public async Task<IActionResult> VerifyEmail(VerifyEmailRequest request)
    {
        var token = request.Token?.Trim();

        if (string.IsNullOrWhiteSpace(token))
        {
            return BadRequest(new
            {
                message = "Verification token is required."
            });
        }

        var user = await _context.Users.SingleOrDefaultAsync(
            user => user.EmailVerificationToken == token);

        if (user is null)
        {
            return BadRequest(new
            {
                message = "Invalid verification token."
            });
        }

        if (user.EmailVerificationTokenExpiresAt is null ||
            user.EmailVerificationTokenExpiresAt <= DateTime.UtcNow)
        {
            return BadRequest(new
            {
                message = "Verification token has expired."
            });
        }

        user.EmailVerified = true;
        user.EmailVerificationToken = null;
        user.EmailVerificationTokenExpiresAt = null;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Email verified successfully.",
            emailVerified = user.EmailVerified
        });
    }

    [AllowAnonymous]
    [HttpPost("resend-verification")]
    public async Task<IActionResult> ResendVerification(
    ResendVerificationRequest request)
    {
        var email = request.Email?.Trim().ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(email))
        {
            return BadRequest(new
            {
                message = "Email is required."
            });
        }

        var genericResponse = new
        {
            message = "If an unverified account exists, a verification email has been sent."
        };

        var user = await _context.Users.SingleOrDefaultAsync(
            user => user.Email == email);

        if (user is null || user.EmailVerified)
        {
            return Ok(genericResponse);
        }

        var verificationToken = Convert.ToHexString(
            RandomNumberGenerator.GetBytes(32));

        user.EmailVerificationToken = verificationToken;
        user.EmailVerificationTokenExpiresAt = DateTime.UtcNow.AddHours(24);

        await _context.SaveChangesAsync();

        try
        {
            await SendVerificationEmailAsync(
                user,
                verificationToken,
                HttpContext.RequestAborted);
        }
        catch (SmtpException exception)
        {
            _logger.LogWarning(
                exception,
                "Verification email could not be resent for user {UserId}.",
                user.Id);
                
            return StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                new
                {
                    message = "Email service is temporarily unavailable. Please try again."
                });
        }

        return Ok(genericResponse);
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

        if (user is null)
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        var passwordVerificationResult = _passwordHasher.VerifyHashedPassword(
            user,
            user.PasswordHash,
            password
        );

        if (passwordVerificationResult == PasswordVerificationResult.Failed)
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.Name),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Role, user.Role.ToString())
        };

        var identity = new ClaimsIdentity(
            claims,
            CookieAuthenticationDefaults.AuthenticationScheme
        );

        var principal = new ClaimsPrincipal(identity);

        var authProperties = new AuthenticationProperties
        {
            IsPersistent = request.RememberMe,
            ExpiresUtc = request.RememberMe
         ? DateTimeOffset.UtcNow.AddDays(7)
         : DateTimeOffset.UtcNow.AddMinutes(30)
        };

        await HttpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            principal,
            authProperties
        );

        return Ok(new
        {
            message = "Login successful.",
            user = new
            {
                user.Id,
                user.Name,
                user.Email,
                Role = user.Role.ToString(),
                user.CreatedAt
            }
        });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var userId = User.GetUserId();

        if (userId is null)
        {
            return Unauthorized(new { message = "Invalid session." });
        }

        var user = await _context.Users.FindAsync(userId.Value);

        if (user is null)
        {
            return Unauthorized(new { message = "User no longer exists." });
        }

        return Ok(new
        {
            user = new
            {
                user.Id,
                user.Name,
                user.Email,
                Role = user.Role.ToString(),
                user.CreatedAt
            }
        });
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);

        return Ok(new { message = "Logout successful." });
    }

    private async Task SendVerificationEmailAsync(
          Users user,
          string verificationToken,
          CancellationToken cancellationToken)
    {
        var verificationLink =
            $"{_emailOptions.FrontendBaseUrl.TrimEnd('/')}/verify-email" +
            $"?token={Uri.EscapeDataString(verificationToken)}";

        var safeName = WebUtility.HtmlEncode(user.Name);
        var safeVerificationLink = WebUtility.HtmlEncode(verificationLink);

        var emailBody = $"""
        <h1>Verify your email</h1>
        <p>Hello {safeName},</p>
        <p>Confirm your email address to activate your account.</p>
        <p>
            <a href="{safeVerificationLink}">Verify my email</a>
        </p>
        <p>This link expires in 24 hours.</p>
        """;

        await _emailSender.SendAsync(
            user.Email,
            "Verify your email",
            emailBody,
            cancellationToken);
    }
}
