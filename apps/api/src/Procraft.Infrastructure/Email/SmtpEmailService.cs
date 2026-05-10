using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Logging;
using Procraft.Application.Common.Interfaces;
using Procraft.Infrastructure.Options;

namespace Procraft.Infrastructure.Email;

public sealed class SmtpEmailService : IEmailService
{
    private readonly SmtpOptions _options;
    private readonly ILogger<SmtpEmailService> _logger;

    public SmtpEmailService(IOptions<SmtpOptions> options, ILogger<SmtpEmailService> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    public async Task SendAsync(string to, string subject, string body, CancellationToken cancellationToken = default)
    {
        if (ShouldUseStub())
        {
            _logger.LogWarning(
                "Email stub is active: no real email was sent. To={To}, Subject={Subject}, Body={Body}. Configure complete SMTP settings before production email delivery.",
                to,
                subject,
                body);
            return;
        }

        using var message = new MailMessage
        {
            From = new MailAddress(_options.FromAddress, _options.FromName),
            Subject = subject,
            Body = body,
        };
        message.To.Add(to);

        using var client = new SmtpClient(_options.Host, _options.Port)
        {
            EnableSsl = _options.EnableSsl,
        };

        if (!string.IsNullOrWhiteSpace(_options.Username))
        {
            client.Credentials = new NetworkCredential(_options.Username, _options.Password);
        }

        await client.SendMailAsync(message, cancellationToken);
        _logger.LogInformation(
            "Email sent. To={To}, Subject={Subject}.",
            to,
            subject);
    }

    private bool ShouldUseStub()
    {
        if (string.IsNullOrWhiteSpace(_options.Host))
        {
            return true;
        }

        return !string.IsNullOrWhiteSpace(_options.Username)
            && string.IsNullOrWhiteSpace(_options.Password);
    }
}
