namespace Procraft.Application.Common.Interfaces;

public interface IPdfService
{
    Task<byte[]> RenderResumeAsync(Guid profileId, CancellationToken cancellationToken = default);
}
