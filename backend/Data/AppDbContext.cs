using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Users> Users => Set<Users>();
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Users>()
            .HasIndex(user => user.Email)
            .IsUnique();

        modelBuilder.Entity<Users>()
            .Property(user => user.Email)
            .IsRequired();

        modelBuilder.Entity<Users>()
            .Property(user => user.Name)
            .IsRequired();
        
        modelBuilder.Entity<Users>()
            .Property(user => user.Role)
            .HasConversion<string>()
            .HasMaxLength(20);

        modelBuilder.Entity<Users>()
            .Property(user => user.EmailVerified)
            .HasDefaultValue(false);

        modelBuilder.Entity<Users>()
            .Property(user => user.EmailVerificationToken)
            .HasMaxLength(128);

        modelBuilder.Entity<Users>()
            .Property(user => user.PasswordHash)
            .IsRequired();
    }
}
