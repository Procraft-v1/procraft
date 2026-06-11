import 'reflect-metadata';

process.env.ASPNETCORE_ENVIRONMENT = process.env.ASPNETCORE_ENVIRONMENT ?? 'Development';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'procraft_e2e_secret_key_for_tests_only_0123456789';
process.env.JWT_ISSUER = process.env.JWT_ISSUER ?? 'procraft.e2e';
process.env.JWT_AUDIENCE = process.env.JWT_AUDIENCE ?? 'procraft.e2e';

import * as jwt from 'jsonwebtoken';
import { PasswordHasher } from '../src/auth/password-hasher';
import { TokenService } from '../src/auth/token.service';
import { parseConnectionString, resetConfigCache } from '../src/config/env';
resetConfigCache();

describe('ASP.NET compatibility primitives', () => {
  describe('PasswordHasher (Identity V3 binary compatibility)', () => {
    const hasher = new PasswordHasher();

    // Reference hashes produced by Microsoft.AspNetCore.Identity.PasswordHasher
    // (Microsoft.Extensions.Identity.Core 8.0.13) on this machine.
    const dotnetVectors: Array<[string, string]> = [
      ['1234', 'AQAAAAIAAYagAAAAEM6EIepaQypilIO6GvBVPmAsjetd5ttNJLb+BiuyX/tQ5+Sy9yU6iDE/KBYq5WhYSw=='],
      [
        'S3cure!Password',
        'AQAAAAIAAYagAAAAEIpASvgerZpVRJMxKdWl+8J1uCO/qwFsNgvqs7EV+MJBmQPX3xXt3Y6NI9r+FtEzJQ==',
      ],
      [
        'parol-2026 unicode-ô',
        'AQAAAAIAAYagAAAAEMAuRjD6aMtaUz9YP8CL73jEQbrCHsW324xjZRK0Jl9M7nK23ruH+I/+iAFRaceIiw==',
      ],
    ];

    it.each(dotnetVectors)('verifies the .NET-produced hash for %p', (password, hash) => {
      expect(hasher.verify(password, hash)).toBe(true);
      expect(hasher.verify(password + 'x', hash)).toBe(false);
    });

    it('produces hashes in the V3 format (.NET-verifiable: proven via dotnet run verify)', () => {
      const hash = hasher.hash('round-trip-check');
      const decoded = Buffer.from(hash, 'base64');
      expect(decoded[0]).toBe(0x01);
      expect(decoded.readUInt32BE(1)).toBe(2); // HMACSHA512
      expect(decoded.readUInt32BE(5)).toBe(100_000);
      expect(decoded.readUInt32BE(9)).toBe(16);
      expect(hasher.verify('round-trip-check', hash)).toBe(true);
    });
  });

  describe('TokenService (JWT claim parity)', () => {
    const tokenService = new TokenService();
    const user = {
      id: '8f3e3e6c-0f8a-4d90-9b18-0d33f0bb7daa',
      email: 'claims@procraft.uz',
      username: 'claimsuser',
    };

    it('emits the claim set the C# JwtSecurityTokenHandler produced', () => {
      const token = tokenService.createAccessToken(user);
      const payload = jwt.decode(token) as jwt.JwtPayload;

      expect(payload.sub).toBe(user.id);
      expect(payload.nameid).toBe(user.id);
      expect(payload.email).toBe(user.email);
      expect(payload.preferred_username).toBe(user.username);
      expect(payload.unique_name).toBe(user.username);
      expect(payload.iss).toBe(process.env.JWT_ISSUER);
      expect(payload.aud).toBe(process.env.JWT_AUDIENCE);
      expect(payload.exp! - payload.nbf!).toBe(15 * 60);

      const header = JSON.parse(Buffer.from(token.split('.')[0], 'base64url').toString());
      expect(header.alg).toBe('HS256');
    });

    it('validates a token built with C#-style claims (nameid only, no sub)', () => {
      const legacyStyle = jwt.sign(
        {
          nameid: user.id,
          email: user.email,
          unique_name: user.username,
          preferred_username: user.username,
        },
        process.env.JWT_SECRET!,
        {
          algorithm: 'HS256',
          issuer: process.env.JWT_ISSUER,
          audience: process.env.JWT_AUDIENCE,
          expiresIn: '15m',
        },
      );

      const result = tokenService.validateAccessToken(legacyStyle);
      expect(result).toEqual({ userId: user.id, email: user.email, username: user.username });
    });

    it('rejects tampered and wrong-audience tokens', () => {
      const token = tokenService.createAccessToken(user);
      expect(tokenService.validateAccessToken(token + 'x')).toBeNull();

      const wrongAudience = jwt.sign({ sub: user.id }, process.env.JWT_SECRET!, {
        algorithm: 'HS256',
        issuer: process.env.JWT_ISSUER,
        audience: 'other-audience',
        expiresIn: '15m',
      });
      expect(tokenService.validateAccessToken(wrongAudience)).toBeNull();
    });

    it('hashes refresh tokens as uppercase SHA-256 hex (DB row compatibility)', () => {
      // printf 'abc' | sha256sum
      expect(tokenService.hashRefreshToken('abc')).toBe(
        'BA7816BF8F01CFEA414140DE5DAE2223B00361A396177A9CB410FF61F20015AD',
      );
    });
  });

  describe('connection string parsing', () => {
    it('parses the ADO.NET format docker-compose passes', () => {
      expect(
        parseConnectionString('Host=postgres;Port=5432;Database=procraft;Username=procraft;Password=p@ss;'),
      ).toEqual({ host: 'postgres', port: 5432, database: 'procraft', username: 'procraft', password: 'p@ss' });
    });

    it('parses URI-style connection strings', () => {
      expect(parseConnectionString('postgres://user:secret@db.internal:6543/maindb')).toEqual({
        host: 'db.internal',
        port: 6543,
        database: 'maindb',
        username: 'user',
        password: 'secret',
      });
    });
  });
});
