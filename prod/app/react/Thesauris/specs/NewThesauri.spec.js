"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");

var _NewThesauri = _interopRequireDefault(require("../NewThesauri"));
var _ThesauriForm = _interopRequireDefault(require("../components/ThesauriForm"));
var _ThesaurisAPI = _interopRequireDefault(require("../ThesaurisAPI"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

describe('NewThesauri', () => {
  let component;
  let context;
  const thesauris = [{ name: 'Countries', values: [{ id: '1', label: 'label1' }, { id: '2', label: 'label2' }] }];

  beforeEach(() => {
    context = { store: { getState: () => ({}), dispatch: jasmine.createSpy('dispatch') } };
    spyOn(_ThesaurisAPI.default, 'get').and.returnValue(Promise.resolve(thesauris));
    component = (0, _enzyme.shallow)(_jsx(_NewThesauri.default, {}), { context });
  });

  it('should render a ThesauriForm with new=true', () => {
    expect(component.find(_ThesauriForm.default).length).toBe(1);
    expect(component.find(_ThesauriForm.default).props().new).toBe(true);
  });

  describe('static requestState()', () => {
    it('should request the thesauris', async () => {
      const actions = await _NewThesauri.default.requestState();
      expect(actions).toMatchSnapshot();
    });
  });
});