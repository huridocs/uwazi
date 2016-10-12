import {store} from 'app/store';

let t = (context, key, _text) => {
  let text = _text || key;
  let state = store.getState();
  let dictionary = state.dictionaries.toJS().find((d) => d.locale === state.locale) || {values: {}};
  return dictionary.values[context] ? dictionary.values[context][key] || text : text;
};

export default t;
