import { templateUtils } from 'api/templates';
import { CSVRow } from 'api/csv/csv';
import { csvConstants, headerWithLanguage, languageCodeSuffix } from './csvDefinitions';

type Languages = string[];

export type RawEntity = {
  language: string;
  propertiesFromColumns: CSVRow;
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
  !key.match(new RegExp(`${csvConstants.languageHeaderSeparator}(${languages.join('|')})$`));

const languageCodeRegexp = (languageCode: string) =>
  new RegExp(`${languageCodeSuffix(languageCode)}$`);

const languagesTranslated = (row: CSVRow, availableLanguages: Languages, currentLanguage: string) =>
  availableLanguages
    .filter(languageCode =>
      Object.keys(row)
        .filter(key => key.match(languageCodeRegexp(languageCode)))
        .map(key => row[key])
        .join('')
        .trim()
    )
    .concat([currentLanguage]);

const extractEntity = (
  row: CSVRow,
  availableLanguages: Languages,
  currentLanguage: string,
  defaultLanguage: string,
  propNameToThesauriId: Record<string, string>,
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
        .filter(key => key.match(languageCodeRegexp(languageCode)))
        .reduce<RawEntity>(
          (entity, key) => {
            const propName = key.split(languageCodeSuffix(languageCode))[0];
            const selectedKey =
              propName in propNameToThesauriId
                ? headerWithLanguage(propName, defaultLanguage)
                : key;
            entity.propertiesFromColumns[propName] = safeNamed[selectedKey]; //eslint-disable-line no-param-reassign
            return entity;
          },
          { propertiesFromColumns: { ...baseEntity }, language: languageCode }
        )
  );

  return {
    rawEntity: rawEntities.find((e: RawEntity) => e.language === currentLanguage),
    rawTranslations: rawEntities.filter((e: RawEntity) => e.language !== currentLanguage),
  };
};

export { extractEntity, toSafeName, notTranslated };
