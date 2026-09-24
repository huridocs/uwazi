import type { Readable } from 'stream';
import { text } from 'stream/consumers';
import { UsageError } from '../errors/UsageError.js';

const STDIN = '-';

/** Where a command's `--request` JSON comes from: the flag itself, or stdin with `-`. */
class RequestInput {
  /** `nargs: 1` so yargs takes a bare `-` as the value instead of a positional. */
  static readonly option = {
    type: 'string',
    nargs: 1,
    describe: 'The command input as JSON ("-" reads it from stdin; --schema shows its shape)',
  } as const;

  /** No `--request` is an empty request, so commands without input need no flag. */
  static async read(raw: unknown, stdin: Readable): Promise<unknown> {
    if (raw === undefined) {
      return {};
    }

    const json = raw === STDIN ? await text(stdin) : String(raw);

    try {
      return JSON.parse(json);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new UsageError(`--request is not valid JSON: ${reason}`);
    }
  }
}

export { RequestInput };
