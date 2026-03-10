import { store } from 'app/store';

export default function blankState() {
  const state = store.getState();
  return !state.thesauris.reduce((r, t) => r || !!t.get('values').size, false);
}
