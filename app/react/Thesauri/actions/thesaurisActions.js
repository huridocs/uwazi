import { actions } from 'app/BasicReducer';
import api from 'app/Thesauri/ThesauriAPI';

export function reloadThesauri() {
  return dispatch =>
    api.get().then(response => {
      dispatch(actions.set('thesauris', response));
    });
}
