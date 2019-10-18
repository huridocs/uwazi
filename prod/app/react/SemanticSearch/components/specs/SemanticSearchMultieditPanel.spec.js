"use strict";var _react = _interopRequireDefault(require("react"));
var _immutable = _interopRequireDefault(require("immutable"));
var _enzyme = require("enzyme");

var _Multireducer = _interopRequireDefault(require("../../../Multireducer"));
var metadataActions = _interopRequireWildcard(require("../../../Metadata/actions/actions"));
var searchActions = _interopRequireWildcard(require("../../actions/actions"));
var _SemanticSearchMultieditPanel = require("../SemanticSearchMultieditPanel");function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function ownKeys(object, enumerableOnly) {var keys = Object.keys(object);if (Object.getOwnPropertySymbols) {keys.push.apply(keys, Object.getOwnPropertySymbols(object));}if (enumerableOnly) keys = keys.filter(function (sym) {return Object.getOwnPropertyDescriptor(object, sym).enumerable;});return keys;}function _objectSpread(target) {for (var i = 1; i < arguments.length; i++) {if (i % 2) {var source = arguments[i] != null ? arguments[i] : {};ownKeys(source, true).forEach(function (key) {_defineProperty(target, key, source[key]);});} else if (Object.getOwnPropertyDescriptors) {Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i]));} else {ownKeys(source).forEach(function (key) {Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(arguments[i], key));});}}return target;}function _defineProperty(obj, key, value) {if (key in obj) {Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });} else {obj[key] = value;}return obj;}

describe('SemanticSearchMultieditPanel', () => {
  let state;
  let dispatch;
  let props;

  const mockAction = (obj, fn) => jest.spyOn(obj, fn).mockReturnValue(() => {});
  beforeEach(() => {
    props = {
      storeKey: 'library',
      formKey: 'semanticSearch.multipleEdit',
      searchId: 'searchId' };

    state = {
      semanticSearch: {
        multiedit: _immutable.default.fromJS([
        { searchId: 'doc1', template: 'tpl1' },
        { searchId: 'doc2', template: 'tpl1' },
        { searchId: 'doc3', template: 'tpl2' }]),

        multipleEditForm: {
          metadata: {
            unchangedField: { pristine: true },
            changedField: { pristine: false } } } },



      templates: _immutable.default.fromJS([
      {
        _id: 'tpl1',
        properties: [
        { name: 'p1', type: 'select', content: 't1' }] },


      {
        _id: 'tpl2',
        properties: [
        { name: 'p1', type: 'select', content: 't1' },
        { name: 'p2', type: 'text' }] }]),



      thesauris: _immutable.default.fromJS([
      { _id: 't1', name: 'T1', values: [{ _id: 'v1', id: 'v1', label: 'V1' }] }]) };


    mockAction(metadataActions, 'loadTemplate');
    mockAction(metadataActions, 'resetReduxForm');
    mockAction(metadataActions, 'multipleUpdate');
    mockAction(searchActions, 'setEditSearchEntities');
    mockAction(searchActions, 'getSearch');
    dispatch = jest.fn().mockImplementation(() => Promise.resolve());
    jest.spyOn(_Multireducer.default, 'wrapDispatch').mockReturnValue(dispatch);
  });

  const getProps = () => _objectSpread({},
  props, {},
  (0, _SemanticSearchMultieditPanel.mapStateToProps)(state), {},
  (0, _SemanticSearchMultieditPanel.mapDispatchToProps)(dispatch, props));


  const render = () => (0, _enzyme.shallow)(_react.default.createElement(_SemanticSearchMultieditPanel.SemanticSearchMultieditPanel, getProps()));

  it('should render multi edit form for semantic search multi edit documents', () => {
    const component = render();
    expect(component).toMatchSnapshot();
  });

  describe('changeTemplate', () => {
    it('should set the template of the entities to the selected one', () => {
      const component = render();
      component.instance().changeTemplate({}, 'tpl3');
      expect(searchActions.setEditSearchEntities.mock.calls).toMatchSnapshot();
    });
  });

  describe('save', () => {
    let formValues;
    let instance;
    let component;
    beforeEach(() => {
      formValues = {
        metadata: {
          unchangedField: 'val1',
          changedField: 'val2' } };


      component = render();
      instance = component.instance();
      spyOn(instance, 'close');
    });

    it('should apply changes to entities and re-fetch the search', async () => {
      await instance.save(formValues);
      expect(metadataActions.multipleUpdate).toHaveBeenCalledWith(
      state.semanticSearch.multiedit,
      { metadata: { changedField: 'val2' } });

      expect(searchActions.getSearch).toHaveBeenCalledWith('searchId');
      expect(instance.close).toHaveBeenCalled();
    });
    it('should update entities icon if icon changed', async () => {
      formValues.icon = 'icon';
      state.semanticSearch.multipleEditForm.icon = {
        pristine: false };

      await instance.save(formValues);
      expect(metadataActions.multipleUpdate).toHaveBeenCalledWith(
      state.semanticSearch.multiedit,
      { metadata: { changedField: 'val2' }, icon: 'icon' });

    });
    it('should set template if common template found', async () => {
      state = _objectSpread({},
      state);

      state.semanticSearch.multiedit =
      state.semanticSearch.multiedit.map(item => item.set('template', 'tpl1'));
      instance = render().instance();
      spyOn(instance, 'close');
      await instance.save(formValues);
      expect(metadataActions.multipleUpdate).toHaveBeenCalledWith(
      state.semanticSearch.multiedit,
      { metadata: { changedField: 'val2' }, template: 'tpl1' });

    });
  });

  describe('close', () => {
    it('should reset form and set entities to an empty list', () => {
      const component = render();
      const instance = component.instance();
      instance.close();
      expect(metadataActions.resetReduxForm).toHaveBeenCalledWith(props.formKey);
      expect(searchActions.setEditSearchEntities).toHaveBeenCalledWith([]);
    });
  });

  describe('open', () => {
    it('should not open side panel if there are no multi edit entities', () => {
      state.semanticSearch.multiedit = _immutable.default.fromJS([]);
      const component = render();
      expect(component).toMatchSnapshot();
    });
  });
});