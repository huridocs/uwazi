/* eslint-disable max-classes-per-file */
// eslint-disable-next-line node/no-restricted-import
import { readFile, readdir } from 'fs/promises';

export class UITranslationNotAvailable extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UITranslationNotAvailable';
  }
}

export class ContentsClient {
  static CONTENTS_DIRECTORY = 'contents/ui-translations';

  async retrievePredefinedTranslations(locale: string) {
    try {
      return (await readFile(`${ContentsClient.CONTENTS_DIRECTORY}/${locale}.csv`)).toString();
    } catch (e) {
      if (e.code === 'ENOENT') {
        throw new UITranslationNotAvailable(
          `Predefined translation for locale ${locale} is not available`
        );
      }
      throw e;
    }
  }

  async retrieveAvailablePredefinedLanguages() {
    try {
      const files = await readdir(ContentsClient.CONTENTS_DIRECTORY);
      return files.map(f => f.replace('.csv', ''));
    } catch (e) {
      if (e.code === 'ENOENT') {
        throw new UITranslationNotAvailable('UI translations directory not found');
      }
      throw e;
    }
  }
}
