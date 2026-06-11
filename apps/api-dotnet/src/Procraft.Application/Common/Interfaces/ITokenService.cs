using Procraft.Domain.Entities;

namespace Procraft.Application.Common.Interfaces;

public interface ITokenService
{
    string CreateAccessToken(User user);

    string GenerateRefreshPlaintext(int sizeBytes = 48);

    string HashRefreshToken(string plaintextRefreshToken);
}
