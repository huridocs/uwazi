import { actions } from '#app/BasicReducer/index.js';
import api from '#app/Thesauri/ThesauriAPI.js';

export function reloadThesauri() {
  return dispatch =>
    api.get().then(response => {
      dispatch(actions.set('thesauris', response));
    });
}
