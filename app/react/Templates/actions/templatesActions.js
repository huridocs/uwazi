import * as types from '~/Templates/actions/actionTypes';

export function setTemplates(templates) {
  return {
    type: types.SET_TEMPLATES,
    templates
  };
}
