"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = _default;var _immutable = require("immutable");
var types = _interopRequireWildcard(require("../actions/actionTypes"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}

const initialState = { open: false, connecting: false };

function _default(state = initialState, action = {}) {
  switch (action.type) {
    case types.OPEN_CONNECTION_PANEL:
      return state.set('open', true);

    case types.CLOSE_CONNECTION_PANEL:
      return state.set('connecting', false).set('open', false);

    case types.SEARCHING_CONNECTIONS:
      return state.set('searching', true);

    case 'connections/searchResults/SET':
      return state.set('searching', false);

    case types.CREATING_CONNECTION:
      return state.set('creating', true);

    case types.CREATING_RANGED_CONNECTION:
      return state.set('connecting', true);

    case types.CANCEL_RANGED_CONNECTION:
      return state.set('connecting', false);

    case types.CONNECTION_CREATED:
      return state.set('creating', false).set('connecting', false).set('open', false);

    default:
      return (0, _immutable.fromJS)(state);}

}