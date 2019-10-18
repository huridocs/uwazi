"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.activitylogSearch = activitylogSearch;exports.activitylogSearchMore = activitylogSearchMore;var _BasicReducer = require("../../BasicReducer");
var _RequestParams = require("../../utils/RequestParams");
var _api = _interopRequireDefault(require("../../utils/api"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const activitylogSearchBase = (query, append = false) => {
  const method = append ? 'concat' : 'set';

  return dispatch => _api.default.get('activitylog', new _RequestParams.RequestParams(query)).
  then(response => {
    dispatch(_BasicReducer.actions.set('activitylog/search', response.json));
    dispatch(_BasicReducer.actions[method]('activitylog/list', response.json.rows));
  });
};

function activitylogSearch(query) {
  return activitylogSearchBase(query);
}

function activitylogSearchMore(query) {
  return activitylogSearchBase(query, true);
}