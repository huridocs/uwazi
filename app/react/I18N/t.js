import { store } from 'app/store';
import React from 'react';
import translate, { getLocaleTranslation, getContext } from '../../shared/translate';
import { Translate } from './';

const testingEnvironment = process.env.NODE_ENV === 'test';
const t = (contextId, key, _text, returnComponent = true) => {
  if (returnComponent && !testingEnvironment) {
    return (<Translate context={contextId}>{key}</Translate>);
  }
  const text = _text || key;

  if (!t.translation) {
    const state = store.getState();
    const translations = state.translations.toJS();
    t.translation = getLocaleTranslation(translations, state.locale);
  }

  const context = getContext(t.translation, contextId);

  return translate(context, key, text);
};

t.resetCachedTranslation = () => {
  t.translation = null;
};


export default t;
