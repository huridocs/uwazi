/** @format */

import csvtojson from 'csvtojson';

import { allLanguages } from 'shared/languagesList';

const csv = (readStream, stopOnError = false) => ({
  onRow(onRowCallback) {
    this.onRowCallback = onRowCallback;
    return this;
  },

  onError(onErrorCallback) {
    this.onErrorCallback = onErrorCallback;
    return this;
  },

  async read() {
    this.reading = true;
    return csvtojson({ delimiter: [',', ';'] })
      .fromStream(readStream)
      .subscribe(async (row, index) => {
        if (!this.reading) {
          return;
        }
        try {
          await this.onRowCallback(row, index);
        } catch (e) {
          this.onErrorCallback(e, row, index);
          if (stopOnError) {
            this.reading = false;
            readStream.unpipe();
            readStream.destroy();
          }
        }
      });
  },

  async toThesauri(language, availableLanguages) {
    const values = await csvtojson({ delimiter: [',', ';'] }).fromStream(readStream);
    const languageLabel = allLanguages.find(l => l.key === language).label;

    const languagesToTranslate = allLanguages
      .filter(l => availableLanguages.includes(l.key) && Object.keys(values[0]).includes(l.label))
      .reduce((map, lang) => ({ ...map, [lang.key]: lang.label }), {});

    return {
      thesauriValues: values.map(v => ({ label: v[languageLabel] })),

      thesauriTranslations: Object.keys(languagesToTranslate).reduce((translations, lang) => {
        translations[lang] = values.map(t => ({
          // eslint-disable-line no-param-reassign
          key: t[languageLabel],
          value: t[languagesToTranslate[lang]],
        }));

        return translations;
      }, {}),
    };
  },
});

export default csv;
