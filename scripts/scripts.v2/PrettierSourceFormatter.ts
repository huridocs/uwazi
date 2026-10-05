import path from 'path';
import { format, resolveConfig } from 'prettier';

/** Formats generated TypeScript with the repository's prettier config. */
class PrettierSourceFormatter {
  static async format(source: string, output: string): Promise<string> {
    const config = await resolveConfig(path.resolve(output));
    return format(source, { ...config, parser: 'typescript' });
  }
}

export { PrettierSourceFormatter };
