import {store} from 'app/store';

let missingTranslations = {
  translations: [],
  add: function (translation) {
    this.translations.push(translation);
  },
  reset: function () {
    this.translations = [];
  },
  exists: function (key) {
    return this.translations.find(t => t.key === key);
  }
};

let t = (contextId, key, _text) => {
  let text = _text || key;
  let state = store.getState();
  let translations = state.translations.toJS();
  let translation = translations.find((d) => d.locale === state.locale) || {contexts: []};
  let context = translation.contexts.find((ctx) => ctx.id === contextId) || {values: {}};

  if (!context.values[key] && contextId === 'System' && !missingTranslations.exists(key)) {
    missingTranslations.add({contextId, key, defaultValue: text});
  }

  return context.values[key] || text;
};

export default t;
export {missingTranslations};
