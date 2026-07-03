namespace backend.Dtos;

public record RegisterRequest(
    string Name,
    string Email,
    string Password
);