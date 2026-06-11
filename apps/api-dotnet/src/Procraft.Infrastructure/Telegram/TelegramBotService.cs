using Microsoft.Extensions.Logging;

namespace Procraft.Infrastructure.Telegram;

/// <summary>Placeholder Telegram integration — no secrets or live API calls.</summary>
public sealed class TelegramBotService
{
    private readonly ILogger<TelegramBotService> _logger;

    public TelegramBotService(ILogger<TelegramBotService> logger)
    {
        _logger = logger;
    }

    public Task NotifyAsync(string message, CancellationToken cancellationToken = default)
    {
        // TODO: connect authenticated bot client using secure configuration providers.
        _logger.LogWarning(
            "Telegram stub is active: no real notification was sent. Message={Message}. Configure TelegramBotService before production notifications.",
            message);
        return Task.CompletedTask;
    }
}
