"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");

var _ThesaurisAPI = _interopRequireDefault(require("../../Thesauris/ThesaurisAPI"));
var _RelationTypesAPI = _interopRequireDefault(require("../../RelationTypes/RelationTypesAPI"));
var _RequestParams = require("../../utils/RequestParams");

var _NewTemplate = _interopRequireDefault(require("../NewTemplate"));
var _TemplatesAPI = _interopRequireDefault(require("../TemplatesAPI"));
var _TemplateCreator = _interopRequireDefault(require("../components/TemplateCreator"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

describe('NewTemplate', () => {
  let component;
  let context;
  const thesauris = [{ label: '1' }, { label: '2' }];
  const templates = [{ name: 'Comic' }, { name: 'Newspaper' }];
  const relationTypes = [{ name: 'Friend' }, { name: 'Family' }];

  beforeEach(() => {
    context = { store: { getState: () => ({}), dispatch: jasmine.createSpy('dispatch') } };
    spyOn(_TemplatesAPI.default, 'get').and.returnValue(templates);
    spyOn(_ThesaurisAPI.default, 'get').and.returnValue(thesauris);
    spyOn(_RelationTypesAPI.default, 'get').and.returnValue(relationTypes);
    component = (0, _enzyme.shallow)(_jsx(_NewTemplate.default, {}), { context });
  });

  it('should render a TemplateCreator', () => {
    expect(component.find(_TemplateCreator.default).length).toBe(1);
  });

  describe('static requestState()', () => {
    it('should request the thesauris and templates to fit in the state', async () => {
      const request = new _RequestParams.RequestParams({});
      const actions = await _NewTemplate.default.requestState(request);

      expect(_TemplatesAPI.default.get).toHaveBeenCalledWith(request.onlyHeaders());
      expect(_ThesaurisAPI.default.get).toHaveBeenCalledWith(request.onlyHeaders());
      expect(_RelationTypesAPI.default.get).toHaveBeenCalledWith(request.onlyHeaders());

      expect(actions).toMatchSnapshot();
    });
  });
});