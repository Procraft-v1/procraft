namespace Procraft.Application.Common.Exceptions;

public sealed class ConflictException : Exception
{
    public ConflictException()
        : base("Conflict")
    {
        Errors = new Dictionary<string, string[]>();
    }

    public ConflictException(IDictionary<string, string[]> errors)
        : base("Conflict")
    {
        Errors = new Dictionary<string, string[]>(errors);
    }

    public IReadOnlyDictionary<string, string[]> Errors { get; }
}
