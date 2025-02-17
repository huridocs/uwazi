import React from 'react';
import { atomStore, translationsAtom, localeAtom } from 'V2/atoms';
import translate, { getLocaleTranslation, getContext } from 'shared/translate';
import { Translate } from './Translate';

//return type as any since there is no way to create conditional returns based on parameters
interface TranslationFunction {
  (contextId?: string, key?: string, text?: string | null, returnComponent?: boolean): any;
  translation?: string;
}

// const updateTranslations = () => {
//   const translations = atomStore.get(translationsAtom);
//   const locale = atomStore.get(localeAtom);
//   t.translation = getLocaleTranslation(translations, locale);
//   return { translations, locale };
// };
//
// atomStore.sub(translationsAtom, () => {
//   updateTranslations();
// });

const t: TranslationFunction = (contextId, key, text, returnComponent = true) => {
  if (!contextId) {
    // eslint-disable-next-line no-console
    console.warn(`You cannot translate "${key}", because context id is "${contextId}"`);
  }

  if (returnComponent) {
    return <Translate context={contextId}>{key}</Translate>;
  }

  // updateTranslations();

  const translations = atomStore.get(translationsAtom);
  const locale = atomStore.get(localeAtom);
  const context = getContext(getLocaleTranslation(translations, locale), contextId);

  return translate(context, key, text || key);
};

export { t };
