import { templateUtils } from 'api/templates';
import { CSVRow } from 'api/csv/csv';

type Languages = string[];

export type RawEntity = {
  language: string;
  [k: string]: string;
};

const toSafeName = (row: CSVRow, newNameGeneration: boolean = false): CSVRow =>
  Object.keys(row).reduce(
    (translatedObject, key) => ({
      ...translatedObject,
      [templateUtils.safeName(key, newNameGeneration)]: row[key],
    }),
    {}
  );

const notTranslated = (languages: Languages) => (key: string) =>
  !key.match(new RegExp(`__(${languages.join('|')})$`));

const languagesTranslated = (row: CSVRow, availableLanguages: Languages, currentLanguage: string) =>
  availableLanguages
    .filter(languageCode =>
      Object.keys(row)
        .filter(key => key.match(new RegExp(`__${languageCode}$`)))
        .map(key => row[key])
        .join('')
        .trim()
    )
    .concat([currentLanguage]);

const extractEntity = (
  row: CSVRow,
  availableLanguages: Languages,
  currentLanguage: string,
  newNameGeneration: boolean = false
) => {
  const safeNamed = toSafeName(row, newNameGeneration);

  const baseEntity = Object.keys(safeNamed)
    .filter(notTranslated(availableLanguages))
    .reduce<CSVRow>((entity, key) => {
      entity[key] = safeNamed[key]; //eslint-disable-line no-param-reassign
      return entity;
    }, {});

  const rawEntities = languagesTranslated(safeNamed, availableLanguages, currentLanguage).map(
    languageCode =>
      Object.keys(safeNamed)
        .filter(key => key.match(new RegExp(`__${languageCode}$`)))
        .reduce<RawEntity>(
          (entity, key) => {
            entity[key.split(`__${languageCode}`)[0]] = safeNamed[key]; //eslint-disable-line no-param-reassign
            return entity;
          },
          { ...baseEntity, language: languageCode }
        )
  );

  return {
    rawEntity: rawEntities.find((e: CSVRow) => e.language === currentLanguage),
    rawTranslations: rawEntities.filter((e: CSVRow) => e.language !== currentLanguage),
  };
};

export { extractEntity, toSafeName };
