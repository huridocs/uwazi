import api from 'app/Templates/TemplatesAPI';
import documentsAPI from 'app/Documents/DocumentsAPI';
import { actions } from 'app/BasicReducer';
import { RequestParams } from 'app/utils/RequestParams';

export function deleteTemplate(template) {
  return dispatch =>
    api.delete(new RequestParams({ _id: template._id })).then(() => {
      dispatch(actions.remove('templates', template));
    });
}

export function checkTemplateCanBeDeleted(template) {
  return () =>
    documentsAPI
      .countByTemplate(new RequestParams({ templateId: template._id }))
      .then(usedForDocuments => {
        if (usedForDocuments) {
          return Promise.reject();
        }
        return Promise.resolve();
      });
}

export function setAsDefault(template) {
  return () => api.setAsDefault(new RequestParams({ _id: template._id }));
}
