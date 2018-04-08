import { store } from 'app/store';

const t = (contextId, key, _text) => {
  //return translations[contextId][key];
  //return 'text';
  const text = _text || key;

  if (!t.translation) {
    const state = store.getState();
    const translations = state.translations.toJS();
    t.translation = translations.find(d => d.locale === state.locale) || { contexts: [] };
    //console.log(t.translation);
  }

  const context = t.translation.contexts.find(ctx => ctx.id === contextId) || { values: {} };

  if (!context.values) {
    console.log(contextId); // eslint-disable-line no-console
    console.log(key); // eslint-disable-line no-console
    console.log(_text); // eslint-disable-line no-console
    console.log(context); // eslint-disable-line no-console
  }

  if (contextId === 'System' && !context.values[key]) {
    console.error(`"${key}" (${text})  key does not exist, configure it on /api/i18n/systemKeys.js`); // eslint-disable-line
  }

  return context.values[key] || text;
};

t.resetCachedTranslation = () => {
  t.translation = null;
};


export default t;
