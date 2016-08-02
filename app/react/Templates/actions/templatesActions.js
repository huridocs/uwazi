import * as types from 'app/Templates/actions/actionTypes';
import api from 'app/Templates/TemplatesAPI';
import documentsAPI from 'app/Library/DocumentsAPI';
import {showModal} from 'app/Modals/actions/modalActions';


export function setTemplates(templates) {
  return {
    type: types.SET_TEMPLATES,
    templates
  };
}

export function deleteTemplate(template) {
  return function (dispatch) {
    return api.delete(template)
    .then(() => {
      dispatch({
        type: types.DELETE_TEMPLATE,
        id: template._id
      });
    });
  };
}

export function checkTemplateCanBeDeleted(template) {
  return function () {
    return documentsAPI.countByTemplate(template._id)
    .then((count) => {
      if (count) {
        return Promise.reject();
      }
    });
  };
}
