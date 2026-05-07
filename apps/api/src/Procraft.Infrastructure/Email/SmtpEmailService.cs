using Microsoft.Extensions.Logging;
using Procraft.Application.Common.Interfaces;

namespace Procraft.Infrastructure.Email;

public sealed class SmtpEmailService : IEmailService
{
    private readonly ILogger<SmtpEmailService> _logger;

    public SmtpEmailService(ILogger<SmtpEmailService> logger)
    {
        _logger = logger;
    }

    public Task SendAsync(string to, string subject, string body, CancellationToken cancellationToken = default)
    {
        // TODO: wire SMTP / SendGrid configuration without embedding secrets in source.
        _logger.LogWarning(
            "Email stub is active: no real email was sent. To={To}, Subject={Subject}. Implement SmtpEmailService before production email delivery.",
            to,
            subject);
        return Task.CompletedTask;
    }
}
