import { store } from 'app/store';
import { isClient } from 'app/utils';

export default function blankState() {
  const state = store.getState();
  if (!isClient) {
    return false;
  }
  return !state.thesauris.reduce((r, t) => r || !!t.get('values').size, false);
}
