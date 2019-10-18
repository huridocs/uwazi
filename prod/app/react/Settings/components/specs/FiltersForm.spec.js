"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _immutable = require("immutable");
var _DragAndDrop = require("../../../Layout/DragAndDrop");
var _SettingsAPI = _interopRequireDefault(require("../../SettingsAPI"));

var _FiltersForm = require("../FiltersForm");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('FiltersForm', () => {
  let component;
  let props;
  let filters;
  let instance;

  beforeEach(() => {
    filters = [
    { id: 1, name: 'Country', container: '', index: 0 },
    { id: 2, name: 'Case', container: '', index: 1 },
    { id: 'asd',
      name: 'Institutions',
      container: '',
      index: 2,
      items: [{ id: 4, name: 'Court' }] }];



    props = {
      notify: () => {},
      setSettings: () => {},
      settings: { collection: (0, _immutable.fromJS)({ filters }) },
      templates: (0, _immutable.fromJS)([{ _id: 1, name: 'Country' }, { _id: 2, name: 'Case' }, { _id: 3, name: 'Judge' }, { _id: 4, name: 'Court' }]) };

  });

  const render = () => {
    component = (0, _enzyme.shallow)(_react.default.createElement(_FiltersForm.FiltersForm, props));
    instance = component.instance();
  };

  it('should set the state with the active filters', () => {
    render();
    expect(component.state().activeFilters).toEqual(filters);
  });

  it('should set the state with the inactiveFilters', () => {
    render();
    expect(component.state().inactiveFilters).toEqual([{ id: 3, name: 'Judge' }]);
  });

  it('should render a DragAndDropContainer with the active filters', () => {
    render();
    const container = component.find(_DragAndDrop.DragAndDropContainer).first();
    expect(container.props().items).toEqual(component.state().activeFilters);
  });

  it('should not allow nesting a group inside a group', () => {
    render();
    component.
    instance().
    activesChange([
    { id: 2, name: 'single', container: '', index: 1 },
    {
      id: 1,
      name: 'group',
      container: '',
      index: 2,
      items: [
      { id: 1, name: 'filter1', container: '', index: 0 },
      { id: 1, name: 'filter2', container: '', index: 1 },
      { id: 1, name: 'group2', container: '', index: 1, items: [] }] }]);




    expect(component.state().activeFilters).toEqual([
    { id: 2, name: 'single', container: '', index: 1 },
    {
      id: 1,
      name: 'group',
      container: '',
      index: 2,
      items: [
      { id: 1, name: 'filter1', container: '', index: 0 },
      { id: 1, name: 'filter2', container: '', index: 1 }] },


    { id: 1, name: 'group2', container: '', index: 1, items: [] }]);

  });

  it('should render a DragAndDropContainer with the unactive filters', () => {
    render();
    const container = component.find(_DragAndDrop.DragAndDropContainer).last();
    expect(container.props().items).toEqual(component.state().inactiveFilters);
  });

  describe('save', () => {
    it('should sanitize and call teh api', () => {
      spyOn(_SettingsAPI.default, 'save').and.returnValue(Promise.resolve());
      instance.save();
      const expectedFilters = {
        data: {
          filters: [
          { id: 1, name: 'Country' },
          { id: 2, name: 'Case' },
          { id: 'asd', items: [{ id: 4, name: 'Court' }], name: 'Institutions' }] },


        headers: {} };

      expect(_SettingsAPI.default.save).toHaveBeenCalledWith(expectedFilters);
    });
  });
});