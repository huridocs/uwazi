import {store} from 'app/store';

let t = (contextId, key, _text) => {
  let text = _text || key;
  let state = store.getState();
  let translations = state.translations.toJS();
  let translation = translations.find((d) => d.locale === state.locale) || {contexts: []};
  let context = translation.contexts.find((ctx) => ctx.id === contextId) || {values: {}};

  return context.values[key] || text;
};

export default t;
