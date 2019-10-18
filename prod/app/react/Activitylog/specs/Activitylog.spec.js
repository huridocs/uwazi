"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _config = require("../../config.js");
var _fetchMock = _interopRequireDefault(require("fetch-mock"));
var _Activitylog = _interopRequireDefault(require("../Activitylog.js"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('Activitylog', () => {
  let component;
  let context;
  let props;

  beforeEach(() => {
    context = { store: { getState: () => ({}) } };
    _fetchMock.default.restore();
    _fetchMock.default.
    get(`${_config.APIURL}activitylog`, { body: JSON.stringify([
      { url: '/api/entities' }]) });

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_Activitylog.default, props), { context });
  };

  it('should render an ActivitylogForm and ActivitylogList', () => {
    render();
    expect(component).toMatchSnapshot();
  });

  it('should request the activitylog', async () => {
    const actions = await _Activitylog.default.requestState();
    expect(actions).toMatchSnapshot();
  });
});