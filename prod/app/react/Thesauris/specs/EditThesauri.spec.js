"use strict";var _react = _interopRequireDefault(require("react"));
var _fetchMock = _interopRequireDefault(require("fetch-mock"));
var _enzyme = require("enzyme");

var _config = require("../../config.js");
var _EditThesauri = _interopRequireDefault(require("../EditThesauri"));
var _ThesauriForm = _interopRequireDefault(require("../components/ThesauriForm"));
var _RouteHandler = _interopRequireDefault(require("../../App/RouteHandler"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('EditThesauri', () => {
  const thesauri = { name: 'Countries', values: [{ id: '1', label: 'label1' }, { id: '2', label: 'label2' }] };
  let component;
  const props = jasmine.createSpyObj(['editThesauri']);
  let context;

  beforeEach(() => {
    _RouteHandler.default.renderedFromServer = true;
    context = { store: { getState: () => ({}), dispatch: jasmine.createSpy('dispatch') } };
    component = (0, _enzyme.shallow)(_react.default.createElement(_EditThesauri.default, props), { context });

    _fetchMock.default.restore();
    _fetchMock.default.
    get(`${_config.APIURL}thesauris?_id=thesauriId`, { body: JSON.stringify({ rows: [thesauri] }) });
  });

  afterEach(() => _fetchMock.default.restore());

  it('should render a ThesauriForm', () => {
    expect(component.find(_ThesauriForm.default).length).toBe(1);
  });

  describe('static requestState()', () => {
    it('should request the thesauris using the param thesauriId', async () => {
      const request = { data: { _id: 'thesauriId' } };
      const actions = await _EditThesauri.default.requestState(request);

      expect(actions).toMatchSnapshot();
    });
  });
});