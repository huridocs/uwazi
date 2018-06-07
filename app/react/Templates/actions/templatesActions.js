import api from 'app/Templates/TemplatesAPI';
import documentsAPI from 'app/Documents/DocumentsAPI';
import { actions } from 'app/BasicReducer';

export function deleteTemplate(template) {
  return dispatch => api.delete(template)
  .then(() => {
    dispatch(actions.remove('templates', template));
  });
}

export function checkTemplateCanBeDeleted(template) {
  return () => documentsAPI.countByTemplate(template._id)
  .then((count) => {
    if (count) {
      return Promise.reject();
    }
    return Promise.resolve();
  });
}
