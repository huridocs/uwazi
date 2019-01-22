import api from 'app/Templates/TemplatesAPI';
import documentsAPI from 'app/Documents/DocumentsAPI';
import TemplatesAPI from 'app/Templates/TemplatesAPI';
import { actions } from 'app/BasicReducer';

export function deleteTemplate(template) {
  return dispatch => api.delete(template)
  .then(() => {
    dispatch(actions.remove('templates', template));
  });
}

export function checkTemplateCanBeDeleted(template) {
  return () => Promise.all([documentsAPI.countByTemplate(template._id), TemplatesAPI.countByThesauri(template)])
  .then(([usedForDocuments, usedAsThesauri]) => {
    if (usedForDocuments || usedAsThesauri) {
      return Promise.reject();
    }
    return Promise.resolve();
  });
}

export function setAsDefault(template) {
  return () => api.setAsDefault(template);
}
