import csvtojson from 'csvtojson';

import { availableLanguages } from 'shared/languagesList';
import { Readable } from 'stream';
import { ensure } from 'shared/tsUtils';
import { LanguageSchema } from 'shared/types/commonTypes';
import { ThesaurusValueSchema } from 'shared/types/thesaurusType';

// eslint-disable-next-line max-statements
const processNested = (value: string) => {
  let processedValue = value;
  let nested = false;
  let stop = false;

  while (processedValue.length > 0 && !nested && !stop) {
    const [firstChar, ...rest] = processedValue;

    if (firstChar === '-') {
      nested = true;
    }
    if (firstChar !== ' ') {
      stop = true;
    }

    processedValue = rest.join('');
  }

  if (!nested) {
    processedValue = value;
  }

  return {
    nested,
    processedValue,
  };
};

const processThesauri = (values: { [k: string]: string }[], languageLabel: string) =>
  values.reduce<ThesaurusValueSchema[]>((thesauriValues, value) => {
    const valueForLanguage = value[languageLabel];
    const { processedValue, nested } = processNested(valueForLanguage);

    if (!nested) return [...thesauriValues, { label: valueForLanguage.trim() }];

    const lastValue = thesauriValues[thesauriValues.length - 1];
    lastValue.values = (lastValue.values ?? []).concat([{ label: processedValue.trim() }]);
    return thesauriValues.slice(0, -1).concat(lastValue);
  }, []);

const processTranslation = (
  values: any[],
  languagesToTranslate: { [k: string]: string },
  languageLabel: string
) =>
  Object.keys(languagesToTranslate).reduce((translations, lang) => {
    // eslint-disable-next-line no-param-reassign
    translations[lang] = Object.fromEntries(
      values.map(t => {
        const { processedValue: key } = processNested(t[languageLabel]);
        const { processedValue: translation } = processNested(t[languagesToTranslate[lang]]);

        return [key.trim(), translation.trim()];
      })
    );

    return translations;
  }, {} as { [k: string]: { [k: string]: string } });

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

  async toThesauri(language: string, iso6391Languages: string[]) {
    const values = await csvtojson({ delimiter: [',', ';'] }).fromStream(readStream);
    const languageLabel: string = ensure<LanguageSchema>(
      availableLanguages.find(l => l.key === language)
    ).label;

    const languagesToTranslate: { [k: string]: string } = availableLanguages
      .filter(l => iso6391Languages.includes(l.key) && Object.keys(values[0]).includes(l.label))
      .reduce((map, lang) => ({ ...map, [lang.key]: lang.label }), {});
    return {
      thesauriValues: processThesauri(values, languageLabel),

      thesauriTranslations: processTranslation(values, languagesToTranslate, languageLabel),
    };
  },
});

export default csv;
