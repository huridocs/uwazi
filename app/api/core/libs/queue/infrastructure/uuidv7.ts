import { randomBytes } from 'crypto';

const TIMESTAMP_BYTES = 6;

/**
 * A UUIDv7 (RFC 9562): 48 bits of epoch milliseconds followed by random bits, so ids sort by
 * creation time and new rows land at the end of the primary key index.
 */
function uuidv7(now: number = Date.now()): string {
  const bytes = randomBytes(16);

  for (let i = 0; i < TIMESTAMP_BYTES; i += 1) {
    bytes[i] = Math.floor(now / 256 ** (TIMESTAMP_BYTES - 1 - i)) % 256;
  }
  bytes[6] = 0x70 + (bytes[6] % 0x10);
  bytes[8] = 0x80 + (bytes[8] % 0x40);

  const hex = bytes.toString('hex');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-');
}

export { uuidv7 };
