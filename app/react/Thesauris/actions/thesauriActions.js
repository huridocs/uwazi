import * as types from '~/Thesauris/actions/actionTypes';

export function addValue() {
  return {
    type: types.ADD_THESAURI_VALUE
  };
}

// export function deleteTemplate(template) {
//   return function (dispatch) {
//     return api.delete(template).then(() => {
//       dispatch({
//         type: types.DELETE_TEMPLATE,
//         id: template._id
//       });
//     });
//   };
// }
