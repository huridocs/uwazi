import React from 'react';
import { atomStore, translationsAtom, localeAtom } from 'V2/atoms';
import translate, { getLocaleTranslation, getContext } from 'shared/translate';
import { Translate } from './Translate';

//return type as any since there is no way to create conditional returns based on parameters
interface TranslationFunction {
  (
    contextId?: string,
    key?: string,
    text?: string | null,
    returnComponent?: boolean,
    truncate?: number
  ): any;
}

const t: TranslationFunction = (
  contextId,
  key,
  text,
  returnComponent = true,
  truncate = undefined
) => {
  if (!contextId) {
    // eslint-disable-next-line no-console
    console.warn(`You cannot translate "${key}", because context id is "${contextId}"`);
  }

  if (returnComponent) {
    return (
      <Translate context={contextId} truncate={truncate}>
        {key}
      </Translate>
    );
  }

  const translations = atomStore.get(translationsAtom);
  const locale = atomStore.get(localeAtom);
  const context = getContext(getLocaleTranslation(translations, locale), contextId);
  const translatedText = translate(context, key, text || key);
  const requiresTruncation = truncate && translatedText.length > truncate;
  return requiresTruncation ? `${translatedText.slice(0, truncate)}...` : translatedText;
};

export { t };
