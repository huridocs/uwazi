import { readdir } from 'node:fs/promises';
import path from 'node:path';

const SKIP_DIRS = new Set([
  'migrations',
  'node_modules',
  'specs',
  'stories',
  'fixtures',
  '__tests__',
  'cypress',
  'dist',
]);

const SKIP_NAME_RE = /(\.spec|\.test|stories|\.cy)/;
const SOURCE_EXT_RE = /\.(js|jsx|ts|tsx)$/;

const listSourceFiles = async (dir: string): Promise<string[]> => {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async entry => {
      const resolved = path.resolve(dir, entry.name);
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) {
          return [];
        }
        return listSourceFiles(resolved);
      }
      if (SKIP_NAME_RE.test(entry.name) || !SOURCE_EXT_RE.test(entry.name)) {
        return [];
      }
      return [resolved];
    })
  );
  return nested.flat();
};

export { listSourceFiles };
