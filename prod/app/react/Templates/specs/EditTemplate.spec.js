"use strict";var _react = _interopRequireDefault(require("react"));
var _fetchMock = _interopRequireDefault(require("fetch-mock"));
var _enzyme = require("enzyme");

var _config = require("../../config.js");
var _EditTemplate = _interopRequireDefault(require("../EditTemplate"));
var _TemplateCreator = _interopRequireDefault(require("../components/TemplateCreator"));
var _RouteHandler = _interopRequireDefault(require("../../App/RouteHandler"));
var _uniqueID = require("../../../shared/uniqueID");
var _RequestParams = require("../../utils/RequestParams");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('EditTemplate', () => {
  const templates = [
  { _id: 'abc1', properties: [{ label: 'label1' }, { label: 'label2' }], commonProperties: [{ label: 'existingProperty' }] },
  { _id: 'abc2', properties: [{ label: 'label3' }, { label: 'label4' }] },
  { _id: 'abc3', properties: [{ label: 'label3' }, { label: 'label4' }], commonProperties: [] }];

  const thesauris = [{ label: '1' }, { label: '2' }];
  const relationTypes = [{ name: 'Friend' }, { name: 'Family' }];
  let component;
  let props;
  let context;

  beforeEach(() => {
    _RouteHandler.default.renderedFromServer = true;
    context = { store: { getState: () => ({}), dispatch: jasmine.createSpy('dispatch') } };
    component = (0, _enzyme.shallow)(_react.default.createElement(_EditTemplate.default, props), { context });
    (0, _uniqueID.mockID)();

    _fetchMock.default.restore();
    _fetchMock.default.
    get(`${_config.APIURL}templates`, { body: JSON.stringify({ rows: templates }) }).
    get(`${_config.APIURL}relationtypes`, { body: JSON.stringify({ rows: relationTypes }) }).
    get(`${_config.APIURL}thesauris`, { body: JSON.stringify({ rows: thesauris }) });
  });

  afterEach(() => _fetchMock.default.restore());

  it('should render a TemplateCreator', () => {
    expect(component.find(_TemplateCreator.default).length).toBe(1);
  });

  describe('static requestState()', () => {
    it('should request templates and thesauris, and return templates, thesauris and find the editing template', async () => {
      const request = new _RequestParams.RequestParams({ templateId: 'abc2' });
      const actions = await _EditTemplate.default.requestState(request);
      expect(actions).toMatchSnapshot();
    });

    it('should prepare the template properties with unique ids', async () => {
      const request = new _RequestParams.RequestParams({ templateId: 'abc2' });
      const actions = await _EditTemplate.default.requestState(request);
      const template = actions[0].value;
      expect(template.properties[0]).toEqual({ label: 'label3', localID: 'unique_id' });
    });

    it('should append new commonProperties if none exist (lazy migration)', async () => {
      const request = new _RequestParams.RequestParams({ templateId: 'abc2' });
      const actions = await _EditTemplate.default.requestState(request);
      const template = actions[0].value;
      expect(template.commonProperties.length).toBe(2);
      expect(template.commonProperties[0].label).toBe('Title');
    });

    it('should append new commonProperties if empty', async () => {
      const request = new _RequestParams.RequestParams({ templateId: 'abc3' });
      const actions = await _EditTemplate.default.requestState(request);
      const template = actions[0].value;
      expect(template.commonProperties.length).toBe(2);
      expect(template.commonProperties[0].label).toBe('Title');
    });

    it('should keep existing commonProperties if they already have values', async () => {
      const request = new _RequestParams.RequestParams({ templateId: 'abc1' });
      const actions = await _EditTemplate.default.requestState(request);
      const template = actions[0].value;
      expect(template.commonProperties.length).toBe(1);
      expect(template.commonProperties[0].label).toBe('existingProperty');
    });
  });
});