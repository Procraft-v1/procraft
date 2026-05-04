using MediatR;
using Procraft.Application.Profiles.DTOs;

namespace Procraft.Application.Profiles.Commands.SelectProfileTemplate;

public sealed record SelectProfileTemplateCommand(Guid TemplateId) : IRequest<ProfileDto>;
