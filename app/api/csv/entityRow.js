import { templateUtils } from 'api/templates';

const toSafeName = rawEntity =>
  Object.keys(rawEntity).reduce(
    (translatedObject, key) => ({
      ...translatedObject,
      [templateUtils.safeName(key)]: rawEntity[key],
    }),
    {}
  );

const notTranslated = languages => key => !key.match(new RegExp(`__(${languages.join('|')})$`));

const languagesTranslated = (row, availableLanguages, currentLanguage) =>
  availableLanguages
    .filter(languageCode =>
      Object.keys(row)
        .filter(key => key.match(new RegExp(`__${languageCode}$`)))
        .map(key => row[key])
        .join('')
        .trim()
    )
    .concat([currentLanguage]);

const extractEntity = (row, availableLanguages, currentLanguage) => {
  const safeNamed = toSafeName(row);

  const baseEntity = Object.keys(safeNamed)
    .filter(notTranslated(availableLanguages))
    .reduce((entity, key) => {
      entity[key] = safeNamed[key]; //eslint-disable-line no-param-reassign
      return entity;
    }, {});

  const rawEntities = languagesTranslated(safeNamed, availableLanguages, currentLanguage).map(
    languageCode =>
      Object.keys(safeNamed)
        .filter(key => key.match(new RegExp(`__${languageCode}$`)))
        .reduce(
          (entity, key) => {
            entity[key.split(`__${languageCode}`)[0]] = safeNamed[key]; //eslint-disable-line no-param-reassign
            return entity;
          },
          { ...baseEntity, language: languageCode }
        )
  );

  return {
    rawEntity: rawEntities.find(e => e.language === currentLanguage),
    rawTranslations: rawEntities.filter(e => e.language !== currentLanguage),
  };
};

export { extractEntity, toSafeName };
