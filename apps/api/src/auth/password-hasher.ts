import { Injectable } from '@nestjs/common';
import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'crypto';

/**
 * Binary-compatible port of Microsoft.AspNetCore.Identity.PasswordHasher (V3/V2).
 *
 * V3 layout (base64): 0x01 | prf(4,BE) | iterCount(4,BE) | saltLen(4,BE) | salt | subkey(32)
 * V2 layout (base64): 0x00 | salt(16) | subkey(32)  — PBKDF2-HMAC-SHA1, 1000 iterations
 *
 * Hashes produced here verify under the original C# implementation and vice
 * versa, so existing user passwords keep working and rollback stays safe.
 */
@Injectable()
export class PasswordHasher {
  private static readonly V3_ITERATIONS = 100_000;
  private static readonly PRF_DIGESTS: Record<number, string> = {
    0: 'sha1',
    1: 'sha256',
    2: 'sha512',
  };

  hash(password: string): string {
    const salt = randomBytes(16);
    const subkey = pbkdf2Sync(password, salt, PasswordHasher.V3_ITERATIONS, 32, 'sha512');

    const output = Buffer.alloc(13 + salt.length + subkey.length);
    output[0] = 0x01;
    output.writeUInt32BE(2, 1); // prf = HMACSHA512
    output.writeUInt32BE(PasswordHasher.V3_ITERATIONS, 5);
    output.writeUInt32BE(salt.length, 9);
    salt.copy(output, 13);
    subkey.copy(output, 13 + salt.length);

    return output.toString('base64');
  }

  verify(password: string, hashedPassword: string): boolean {
    let decoded: Buffer;
    try {
      decoded = Buffer.from(hashedPassword, 'base64');
    } catch {
      return false;
    }

    if (decoded.length === 0) {
      return false;
    }

    switch (decoded[0]) {
      case 0x01:
        return this.verifyV3(password, decoded);
      case 0x00:
        return this.verifyV2(password, decoded);
      default:
        return false;
    }
  }

  private verifyV3(password: string, decoded: Buffer): boolean {
    try {
      const prf = decoded.readUInt32BE(1);
      const iterations = decoded.readUInt32BE(5);
      const saltLength = decoded.readUInt32BE(9);

      if (saltLength < 16 || iterations < 1) {
        return false;
      }

      const digest = PasswordHasher.PRF_DIGESTS[prf];
      if (!digest) {
        return false;
      }

      const salt = decoded.subarray(13, 13 + saltLength);
      const expectedSubkey = decoded.subarray(13 + saltLength);
      if (expectedSubkey.length < 16) {
        return false;
      }

      const actualSubkey = pbkdf2Sync(password, salt, iterations, expectedSubkey.length, digest);
      return timingSafeEqual(actualSubkey, expectedSubkey);
    } catch {
      return false;
    }
  }

  private verifyV2(password: string, decoded: Buffer): boolean {
    try {
      if (decoded.length !== 1 + 16 + 32) {
        return false;
      }

      const salt = decoded.subarray(1, 17);
      const expectedSubkey = decoded.subarray(17);
      const actualSubkey = pbkdf2Sync(password, salt, 1000, 32, 'sha1');
      return timingSafeEqual(actualSubkey, expectedSubkey);
    } catch {
      return false;
    }
  }
}
