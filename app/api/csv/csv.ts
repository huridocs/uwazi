import csvtojson from 'csvtojson';

import { allLanguages } from 'shared/languagesList';
import { Readable } from 'stream';
import { ensure } from 'shared/tsUtils';
import { LanguageSchema } from 'shared/types/commonTypes';

export type CSVRow = { [k: string]: string };

const csv = (readStream: Readable, stopOnError = false) => ({
  reading: false,
  onRowCallback: async (_row: CSVRow, _index: number) => {},
  onErrorCallback: async (_error: Error, _row: CSVRow, _index: number) => {},

  onRow(onRowCallback: (_row: CSVRow, _index: number) => Promise<void>) {
    this.onRowCallback = onRowCallback;
    return this;
  },

  onError(onErrorCallback: (_error: Error, _row: CSVRow, _index: number) => Promise<void>) {
    this.onErrorCallback = onErrorCallback;
    return this;
  },

  async read() {
    this.reading = true;
    return csvtojson({ delimiter: [',', ';'] })
      .fromStream(readStream)
      .subscribe(async (row: CSVRow, index) => {
        if (!this.reading) {
          return;
        }
        try {
          await this.onRowCallback(row, index);
        } catch (e) {
          await this.onErrorCallback(e, row, index);
          if (stopOnError) {
            this.reading = false;
            readStream.unpipe();
            readStream.destroy();
          }
        }
      });
  },

  async toThesauri(language: string, availableLanguages: string[]) {
    const values = await csvtojson({ delimiter: [',', ';'] }).fromStream(readStream);
    const languageLabel: string = ensure<LanguageSchema>(allLanguages.find(l => l.key === language))
      .label;

    const languagesToTranslate: { [k: string]: string } = allLanguages
      .filter(l => availableLanguages.includes(l.key) && Object.keys(values[0]).includes(l.label))
      .reduce((map, lang) => ({ ...map, [lang.key]: lang.label }), {});

    return {
      thesauriValues: values.map(v => ({ label: v[languageLabel] })),

      thesauriTranslations: Object.keys(languagesToTranslate).reduce((translations, lang) => {
        // eslint-disable-line no-param-reassign
        translations[lang] = values.map(t => ({
          key: t[languageLabel],
          value: t[languagesToTranslate[lang]],
        }));

        return translations;
      }, {} as { [k: string]: { key: string; value: string }[] }),
    };
  },
});

export default csv;
