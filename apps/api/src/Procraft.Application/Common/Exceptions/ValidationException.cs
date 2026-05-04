namespace Procraft.Application.Common.Exceptions;



public sealed class ValidationException : Exception

{

    public ValidationException()

        : base("Validation failed")

    {

        Errors = new Dictionary<string, string[]>();

    }



    public ValidationException(IDictionary<string, string[]> errors)

        : base("Validation failed")

    {

        Errors = new Dictionary<string, string[]>(errors);

    }



    public IReadOnlyDictionary<string, string[]> Errors { get; }

}
