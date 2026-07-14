using System.Net.Mail;
using backend.Options;
using Microsoft.Extensions.Options;

namespace backend.Services;

public sealed class SmtpEmailSender(
    IOptions<EmailOptions> options) : IEmailSender {
    
    private readonly EmailOptions _options = options.Value;

    public async Task SendAsync(
         string recipientEmail,
        string subject,
        string htmlBody,
        CancellationToken cancellationToken = default)
    {
        using var message = new MailMessage
        {
            From = new MailAddress(
                _options.SenderEmail,
                _options.SenderName),
            Subject = subject,
            Body = htmlBody,
            IsBodyHtml = true
        };

        message.To.Add(recipientEmail);

        using var smtpClient =  new SmtpClient(
            _options.SmtpHost,
            _options.SmtpPort)
        {
            EnableSsl = false,
            UseDefaultCredentials = false
        };

        await smtpClient.SendMailAsync(message,cancellationToken);
    }
}