import * as os from 'os';
import path from 'path';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
// eslint-disable-next-line node/no-restricted-import -- CSVLoader needs a filesystem path
import { createWriteStream } from 'fs';
import { CSVLoader } from '#api/csv/index.js';
import { generateFileName } from '#api/files/index.js';
import { DefaultTranslations, UITranslationNotAvailable } from '#api/i18n/defaultTranslations.js';

/**
 * Loads predefined System UI translations from CSV on disk.
 * Intentionally outside translation Mongo transactions (FS + CSV loader).
 */
async function importPredefinedTranslations(locale: string): Promise<void> {
  const translationsCsv = await DefaultTranslations.retrievePredefinedTranslations(locale);
  const tmpCsv = path.join(os.tmpdir(), generateFileName({ originalname: 'tmp-csv.csv' }));
  await pipeline(Readable.from(translationsCsv), createWriteStream(tmpCsv));
  await new CSVLoader().loadTranslations(tmpCsv, 'System');
}

/**
 * Same as `importPredefinedTranslations`, but swallows missing-locale errors
 * (AddLanguage continues when a predefined CSV is not available).
 */
async function importPredefinedTranslationsIfAvailable(locale: string): Promise<void> {
  try {
    await importPredefinedTranslations(locale);
  } catch (error) {
    if (!(error instanceof UITranslationNotAvailable)) throw error;
  }
}

type ImportPredefinedTranslations = {
  execute: (locale: string) => Promise<void>;
};

const ImportPredefinedTranslationsService: ImportPredefinedTranslations = {
  execute: importPredefinedTranslationsIfAvailable,
};

export {
  ImportPredefinedTranslationsService,
  importPredefinedTranslations,
  importPredefinedTranslationsIfAvailable,
};
export type { ImportPredefinedTranslations };
