using Procraft.Application.Common.Models;

namespace Procraft.Application.Common.Interfaces;

public interface ICurrentUserService
{
    CurrentUser? GetCurrentUser();
}
