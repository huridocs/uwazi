import { actions } from '#app/BasicReducer/index.js';
import { thesauriAPI } from '#app/Thesauri/ThesauriAPI.js';

export function reloadThesauri() {
  return dispatch =>
    thesauriAPI.get().then(response => {
      dispatch(actions.set('thesauris', response));
    });
}
