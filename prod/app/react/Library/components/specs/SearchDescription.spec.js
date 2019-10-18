"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _immutable = _interopRequireDefault(require("immutable"));

var _libraryFilters = _interopRequireDefault(require("../../helpers/libraryFilters"));

var _SearchDescription = require("../SearchDescription");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}


describe('SearchDescription', () => {
  let searchTerm;
  let query;
  let properties;
  let state;

  beforeEach(() => {
    searchTerm = 'test';
    query = { filters: { p1: { values: ['p1v1', 'p1v2'] }, p2: { values: ['p2v1'] }, p4: { from: 3243 } }, types: ['t1'] };
    properties = [
    {
      name: 'p1',
      label: 'Prop 1',
      options: [
      { id: 'p1v1', label: 'Prop 1 Val 1' },
      { id: 'p1v2', label: 'Prop 2 Val 2' }] },


    {
      name: 'p2',
      label: 'Prop 2',
      options: [
      { id: 'p2v1', label: 'Prop 2 Val 1' },
      { id: 'p2v2', label: 'Prop 2 Val 2' }] },


    {
      name: 'p3',
      label: 'Prop 3',
      options: [
      { id: 'p3v1', label: 'Prop 3 Val 1' }] },


    {
      name: 'p4',
      label: 'Prop 4' }];


    state = {
      templates: _immutable.default.fromJS(['templates']),
      thesauris: _immutable.default.fromJS(['thesauri']),
      relationTypes: _immutable.default.fromJS(['relationTypes']) };

    jest.spyOn(_libraryFilters.default, 'URLQueryToState').mockReturnValue({
      properties });

  });

  const render = () => (0, _enzyme.shallow)(
  _jsx(_SearchDescription.SearchDescription, { searchTerm: searchTerm, query: query, properties: properties }));


  it('should generate description based on property filters', () => {
    const component = render();
    expect(component).toMatchSnapshot();
  });

  it('should only display search term if query is not provided', () => {
    query = undefined;
    const component = render();
    expect(component).toMatchSnapshot();
  });

  describe('mapStateToProps', () => {
    beforeEach(() => {

    });
    it('should get properties from templates, thesauri and relation types', () => {
      const props = (0, _SearchDescription.mapStateToProps)(state, { query });
      expect(_libraryFilters.default.URLQueryToState).toHaveBeenCalledWith(query, ['templates'], ['thesauri'], ['relationTypes']);
      expect(props.properties).toEqual(properties);
    });
    it('should not get properties if query is not provided', () => {
      _libraryFilters.default.URLQueryToState.mockClear();
      query = undefined;
      const props = (0, _SearchDescription.mapStateToProps)(state, { query });
      expect(_libraryFilters.default.URLQueryToState).not.toHaveBeenCalled();
      expect(props.properties).toEqual([]);
    });
  });
});