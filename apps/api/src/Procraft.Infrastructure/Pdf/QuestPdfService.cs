using Procraft.Application.Common.Interfaces;
using QuestPDF.Fluent;
using QuestPDF.Infrastructure;

namespace Procraft.Infrastructure.Pdf;

public sealed class QuestPdfService : IPdfService
{
    public Task<byte[]> RenderResumeAsync(Guid profileId, CancellationToken cancellationToken = default)
    {
        // TODO: compose real resume layout from profile aggregate data.
        QuestPDF.Settings.License = LicenseType.Community;

        var bytes = Document.Create(document =>
        {
            document.Page(page =>
            {
                page.Margin(32);
                page.Content().Column(column =>
                {
                    column.Item().Text("Procraft résumé export").SemiBold().FontSize(18);
                    column.Item().Text($"ProfileId: {profileId}")
                        .FontSize(11);
                    column.Item().Text("Placeholder PDF — replace once PDF composition lands.").FontSize(11);
                });
            });
        }).GeneratePdf();

        return Task.FromResult(bytes);
    }
}
