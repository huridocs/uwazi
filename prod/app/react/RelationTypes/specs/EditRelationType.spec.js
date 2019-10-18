"use strict";var _react = _interopRequireDefault(require("react"));
var _fetchMock = _interopRequireDefault(require("fetch-mock"));
var _enzyme = require("enzyme");

var _config = require("../../config.js");
var _EditRelationType = _interopRequireDefault(require("../EditRelationType"));
var _RouteHandler = _interopRequireDefault(require("../../App/RouteHandler"));
var _TemplateCreator = _interopRequireDefault(require("../../Templates/components/TemplateCreator"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('EditRelationType', () => {
  const relationType = { name: 'Against' };
  let component;
  const props = jasmine.createSpyObj(['editRelationType']);
  let context;

  beforeEach(() => {
    _RouteHandler.default.renderedFromServer = true;
    context = { store: { getState: () => ({}), dispatch: jasmine.createSpy('dispatch') } };
    component = (0, _enzyme.shallow)(_react.default.createElement(_EditRelationType.default, props), { context });

    _fetchMock.default.restore();
    _fetchMock.default.
    get(`${_config.APIURL}relationtypes?_id=relationTypeId`, { body: JSON.stringify({ rows: [relationType] }) });
  });

  afterEach(() => _fetchMock.default.restore());

  it('should render a RelationTypeForm', () => {
    expect(component.find(_TemplateCreator.default).length).toBe(1);
  });

  describe('static requestState()', () => {
    it('should request the relationTypes using the param relationTypeId', async () => {
      const request = { data: { _id: 'relationTypeId' } };
      const actions = await _EditRelationType.default.requestState(request);
      expect(actions).toMatchSnapshot();
    });
  });
});