"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _reactReduxForm = require("react-redux-form");

var _UI = require("../../../UI");

var _SearchBar = require("../SearchBar");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('SearchBar (Entities)', () => {
  let component;
  let instance;
  let props;

  beforeEach(() => {
    jasmine.clock().install();
    spyOn(_reactReduxForm.actions, 'change');

    props = {
      entityId: 'id1',
      search: {},
      searchReferences: jasmine.createSpy('searchReferences'),
      change: _reactReduxForm.actions.change };

  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_SearchBar.SearchBar, props));
    instance = component.instance();
  };

  it('should render a form with the input linked to the state values, which searches references on change (debounced)', () => {
    render();

    expect(component.find(_reactReduxForm.Form).props().model).toBe('relationships/list/search');
    expect(component.find(_reactReduxForm.Form).props().onSubmit).toBe(props.searchReferences);

    expect(component.find(_reactReduxForm.Field).props().model).toBe('relationships/list/search.searchTerm');
    expect(component.find('input').props().value).toBe('');

    component.find('input').simulate('change');
    expect(props.searchReferences).not.toHaveBeenCalled();
    jasmine.clock().tick(401);
    expect(props.searchReferences).toHaveBeenCalled();
  });

  it('should render an "X" to reset the search', () => {
    render();

    component.find(_UI.Icon).at(1).simulate('click');
    expect(_reactReduxForm.actions.change).toHaveBeenCalledWith('relationships/list/search.searchTerm', '');
    expect(props.searchReferences).toHaveBeenCalled();
  });

  describe('componentWillReceiveProps', () => {
    beforeEach(() => {
      render();
    });

    it('should reset search term when changing the entity', () => {
      instance.componentWillReceiveProps({ entityId: 'id1' });
      expect(props.searchReferences).not.toHaveBeenCalled();
      instance.componentWillReceiveProps({ entityId: 'id2' });
      expect(_reactReduxForm.actions.change).toHaveBeenCalledWith('relationships/list/search.searchTerm', '');
    });
  });

  describe('componentWillUnmount', () => {
    beforeEach(() => {
      render();
    });

    it('should reset search term', () => {
      instance.componentWillUnmount();
      expect(_reactReduxForm.actions.change).toHaveBeenCalledWith('relationships/list/search.searchTerm', '');
    });
  });

  describe('mapStateToProps', () => {
    it('should map entityId and search from connectionsList', () => {
      const state = { relationships: { list: { entityId: 'sid', search: 'search' } } };
      expect((0, _SearchBar.mapStateToProps)(state).entityId).toBe('sid');
      expect((0, _SearchBar.mapStateToProps)(state).search).toBe('search');
    });
  });
});