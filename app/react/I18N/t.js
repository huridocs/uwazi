import {store} from 'app/store';

let t = (context, key, _text) => {
  let text = _text || key;
  let state = store.getState();
  let translation = state.translations.toJS().find((d) => d.locale === state.locale) || {values: {}};
  return translation.values[context] ? translation.values[context][key] || text : text;
};

export default t;
