/* eslint-disable max-classes-per-file */
// eslint-disable-next-line node/no-restricted-import
import { readFile, readdir } from 'fs/promises';

import { validateFormat } from 'api/csv/csv';
import importFile from 'api/csv/importFile';
import { objectIndex } from 'shared/data_utils/objectIndex';
import { availableLanguages } from 'shared/languagesList';
import { CSVLoader } from 'api/csv';

const availableLanguagesByKey = objectIndex(
  availableLanguages,
  l => l.key,
  l => l
);

export class UITranslationNotAvailable extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UITranslationNotAvailable';
  }
}

export class DefaultTranslations {
  static CONTENTS_DIRECTORY = 'contents/ui-translations';

  static async retrievePredefinedTranslations(locale: string) {
    try {
      const filePath = `${DefaultTranslations.CONTENTS_DIRECTORY}/${locale}.csv`;
      const loader = new CSVLoader();
      await loader.validateFormat(filePath, {
        column_number: 2,
        no_empty_values: true,
        required_headers: ['Key', availableLanguagesByKey[locale]?.label],
      });
      const content = (await readFile(filePath)).toString();
      return content;
    } catch (e) {
      if (e.code === 'ENOENT') {
        throw new UITranslationNotAvailable(
          `Predefined translation for locale ${locale} is not available`
        );
      }
      throw e;
    }
  }

  static async retrieveAvailablePredefinedLanguages() {
    try {
      const files = await readdir(DefaultTranslations.CONTENTS_DIRECTORY);
      return files.map(f => f.replace('.csv', ''));
    } catch (e) {
      if (e.code === 'ENOENT') {
        throw new UITranslationNotAvailable('UI translations directory not found');
      }
      throw e;
    }
  }
}
