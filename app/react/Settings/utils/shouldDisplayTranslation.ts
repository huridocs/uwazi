import { ClientLanguageSchema } from 'app/apiResponseTypes';
import { t } from 'app/I18N';
import { IImmutable } from 'shared/types/Immutable';

const shouldDisplayTranslation = (
  name: string,
  contexId: string,
  locale: string,
  availableLanguages: IImmutable<ClientLanguageSchema[]>
) => {
  const defaultLanguageKey = availableLanguages
    .find(language => language?.get('default') === true)
    .get('key');
  const isDefaultLanguage = locale === defaultLanguageKey;
  const translatedTemplateName = t(contexId, name, undefined, false);

  switch (true) {
    case isDefaultLanguage && translatedTemplateName !== name:
      return true;

    case !isDefaultLanguage:
      return true;

    default:
      return false;
  }
};

export { shouldDisplayTranslation };
