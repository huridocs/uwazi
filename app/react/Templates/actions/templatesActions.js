import * as types from '~/Templates/actions/actionTypes';
import api from '~/Templates/TemplatesAPI';

export function setTemplates(templates) {
  return {
    type: types.SET_TEMPLATES,
    templates
  };
}

export function deleteTemplate(template) {
  return function (dispatch) {
    return api.delete(template).then(() => {
      dispatch({
        type: types.DELETE_TEMPLATE,
        id: template._id
      });
    });
  };
}
