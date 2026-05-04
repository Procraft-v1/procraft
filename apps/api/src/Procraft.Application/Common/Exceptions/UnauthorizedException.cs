namespace Procraft.Application.Common.Exceptions;

public sealed class UnauthorizedException : Exception
{
    public UnauthorizedException()
    {
    }

    public UnauthorizedException(string message)
        : base(message)
    {
    }
}
