"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = _default;var _immutable = require("immutable");
var types = _interopRequireWildcard(require("../actions/actionTypes"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}

const initialState = { editing: false, saving: false, addTo: { hubIndex: null, rightRelationshipIndex: null } };

function _default(state = initialState, action = {}) {
  switch (action.type) {
    case types.EDIT_RELATIONSHIPS:
      return state.set('editing', action.value);

    case types.SET_RELATIONSHIPS_ADD_TO_DATA:
      return state.setIn(['addTo', 'hubIndex'], action.index).setIn(['addTo', 'rightRelationshipIndex'], action.rightIndex);

    case types.SAVING_RELATIONSHIPS:
      return state.set('saving', true);

    case types.SAVED_RELATIONSHIPS:
      return state.set('saving', false);

    default:
      return (0, _immutable.fromJS)(state);}

}