using System.Net;
using System.Text.Json;
using Procraft.Application.Common.Exceptions;

namespace Procraft.Api.Middleware;

public sealed class ExceptionHandlingMiddleware
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception");
            await WriteProblemAsync(context, ex);
        }
    }

    private static Task WriteProblemAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        return exception switch
        {
            ValidationException ve => WritePayloadAsync(context, HttpStatusCode.BadRequest, new
            {
                message = "Validation failed",
                errors = ToCamelErrors(ve.Errors),
            }),
            ConflictException ce => WritePayloadAsync(context, HttpStatusCode.Conflict, new
            {
                message = "Conflict",
                errors = ToCamelErrors(ce.Errors),
            }),
            UnauthorizedException ue => WritePayloadAsync(context, HttpStatusCode.Unauthorized, new
            {
                message = ue.Message,
            }),
            NotFoundException ne => WritePayloadAsync(context, HttpStatusCode.NotFound, new
            {
                message = ne.Message,
            }),
            _ => WritePayloadAsync(context, HttpStatusCode.InternalServerError, new
            {
                message = "An unexpected error occurred.",
            }),
        };
    }

    private static Task WritePayloadAsync(HttpContext context, HttpStatusCode status, object payload)
    {
        context.Response.StatusCode = (int)status;
        return context.Response.WriteAsync(JsonSerializer.Serialize(payload, JsonOptions));
    }

    private static Dictionary<string, string[]> ToCamelErrors(IReadOnlyDictionary<string, string[]> errors)
    {
        var policy = JsonNamingPolicy.CamelCase;
        return errors.ToDictionary(
            kv => policy.ConvertName(GetLeafPropertyName(kv.Key)),
            kv => kv.Value);
    }

    private static string GetLeafPropertyName(string key)
    {
        var segments = key.Split('.', StringSplitOptions.RemoveEmptyEntries);
        return segments.Length > 0 ? segments[^1] : key;
    }
}
