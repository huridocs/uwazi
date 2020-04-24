import { templateUtils } from 'api/templates';
import { csvRow } from 'api/csv/csv';

type languages = string[];
export type rawEntity = { [k: string]: string };

const toSafeName = (row: csvRow): csvRow =>
  Object.keys(row).reduce(
    (translatedObject, key) => ({
      ...translatedObject,
      [templateUtils.safeName(key)]: row[key],
    }),
    {}
  );

const notTranslated = (languages: languages) => (key: string) =>
  !key.match(new RegExp(`__(${languages.join('|')})$`));

const languagesTranslated = (row: csvRow, availableLanguages: languages, currentLanguage: string) =>
  availableLanguages
    .filter(languageCode =>
      Object.keys(row)
        .filter(key => key.match(new RegExp(`__${languageCode}$`)))
        .map(key => row[key])
        .join('')
        .trim()
    )
    .concat([currentLanguage]);

const extractEntity = (row: csvRow, availableLanguages: languages, currentLanguage: string) => {
  const safeNamed = toSafeName(row);

  const baseEntity = Object.keys(safeNamed)
    .filter(notTranslated(availableLanguages))
    .reduce<rawEntity>((entity, key) => {
      entity[key] = safeNamed[key]; //eslint-disable-line no-param-reassign
      return entity;
    }, {});

  const rawEntities = languagesTranslated(safeNamed, availableLanguages, currentLanguage).map(
    languageCode =>
      Object.keys(safeNamed)
        .filter(key => key.match(new RegExp(`__${languageCode}$`)))
        .reduce<rawEntity>(
          (entity, key) => {
            entity[key.split(`__${languageCode}`)[0]] = safeNamed[key]; //eslint-disable-line no-param-reassign
            return entity;
          },
          { ...baseEntity, language: languageCode }
        )
  );

  return {
    rawEntity: rawEntities.find((e: csvRow) => e.language === currentLanguage),
    rawTranslations: rawEntities.filter((e: csvRow) => e.language !== currentLanguage),
  };
};

export { extractEntity, toSafeName };
