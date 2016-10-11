import {store} from 'app/store';

let t = (key, _text) => {
  let text = _text || key;
  let state = store.getState();
  let dictionary = state.dictionaries.toJS().find((d) => d.locale === state.locale) || {values: {}};
  return dictionary.values[key] || text;
};

export default t;
