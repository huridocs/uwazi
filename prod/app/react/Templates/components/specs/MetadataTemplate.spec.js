"use strict";var _react = _interopRequireWildcard(require("react"));
var _testUtils = _interopRequireDefault(require("react-dom/test-utils"));
var _reactDndTestBackend = _interopRequireDefault(require("react-dnd-test-backend"));
var _reactDnd = require("react-dnd");
var _reactRedux = require("react-redux");
var _immutable = _interopRequireDefault(require("immutable"));
var _enzyme = require("enzyme");
var _reactReduxForm = require("react-redux-form");
var _redux = require("redux");

var _MetadataTemplate = require("../MetadataTemplate");
var _MetadataProperty = _interopRequireDefault(require("../MetadataProperty"));
var _PropertyOption = require("../PropertyOption");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}function _extends() {_extends = Object.assign || function (target) {for (var i = 1; i < arguments.length; i++) {var source = arguments[i];for (var key in source) {if (Object.prototype.hasOwnProperty.call(source, key)) {target[key] = source[key];}}}return target;};return _extends.apply(this, arguments);}

function sourceTargetTestContext(Target, Source, actions) {
  return (0, _reactDnd.DragDropContext)(_reactDndTestBackend.default)(
  class TestContextContainer extends _react.Component {
    render() {
      const identity = x => x;
      const properties = [{ label: 'childTarget', localID: 'childId', inserting: true, type: 'text' }];
      const commonProperties = [];
      const templates = _immutable.default.fromJS([]);
      const targetProps = {
        properties,
        commonProperties,
        templates,
        connectDropTarget: identity,
        formState: { fields: {}, errors: {} },
        backUrl: 'url',
        saveTemplate: jasmine.createSpy('saveTemplate'),
        defaultColor: '#112233' };

      const sourceProps = {
        label: 'source',
        type: 'type',
        index: 2,
        localID: 'source',
        addProperty: () => {},
        connectDragSource: identity,
        formState: { fields: {}, errors: {} } };


      return (
        _jsx("div", {}, void 0,
        _react.default.createElement(Target, _extends({}, targetProps, actions)),
        _react.default.createElement(Source, sourceProps)));


    }});


}

describe('MetadataTemplate', () => {
  function renderComponent(ComponentToRender, props = {}, properties = []) {
    let result;
    const formModel = { name: '', properties, commonProperties: [{ isCommonProperty: true, label: 'Title' }] };
    props.properties = properties;
    props.backUrl = 'url';
    const initialData = {
      template: { data: formModel },
      form: { template: {} },
      templates: _immutable.default.fromJS({ templates: [] }),
      modals: _immutable.default.fromJS({}) };

    const store = (0, _redux.createStore)(
    (0, _redux.combineReducers)({ template:
      (0, _redux.combineReducers)({
        data: (0, _reactReduxForm.modelReducer)('template.data', formModel),
        formState: (0, _reactReduxForm.formReducer)('template.data'),
        uiState: () => _immutable.default.fromJS({ editProperty: '' }) }),

      templates: () => _immutable.default.fromJS([]),
      form: () => initialData.form,
      modals: () => initialData.modals }),

    initialData);

    _testUtils.default.renderIntoDocument(_jsx(_reactRedux.Provider, { store: store }, void 0, _react.default.createElement(ComponentToRender, _extends({ ref: ref => result = ref }, props, { index: 1 }))));
    return result;
  }

  const props = {
    backUrl: '',
    _id: '123',
    commonProperties: [],
    properties: [],
    connectDropTarget: x => x,
    formState: { fields: {} },
    templates: _immutable.default.fromJS([]),
    saveTemplate: jasmine.createSpy('saveTemplate'),
    defaultColor: '#112233' };


  describe('render()', () => {
    it('should disable send button when saving the template', () => {
      let component = (0, _enzyme.shallow)(_react.default.createElement(_MetadataTemplate.MetadataTemplate, props));
      expect(component.find('button').props().disabled).toBe(false);

      props.savingTemplate = true;
      component = (0, _enzyme.shallow)(_react.default.createElement(_MetadataTemplate.MetadataTemplate, props));
      expect(component.find('button').props().disabled).toBe(true);
    });

    it('should render the template name field', () => {
      const component = (0, _enzyme.shallow)(_react.default.createElement(_MetadataTemplate.MetadataTemplate, props));
      expect(component.find(_reactReduxForm.Field).getElements()[0].props.model).toBe('.name');
    });

    it('should render template color field', () => {
      const component = (0, _enzyme.shallow)(_react.default.createElement(_MetadataTemplate.MetadataTemplate, props));
      expect(component.find(_reactReduxForm.Control).first()).toMatchSnapshot();
    });

    describe('when fields is empty', () => {
      it('should render a blank state', () => {
        const component = (0, _enzyme.shallow)(_react.default.createElement(_MetadataTemplate.MetadataTemplate, props));
        expect(component.find('.no-properties').length).toBe(1);
      });
    });

    describe('when it has commonProperties', () => {
      it('should render all commonProperties as MetadataProperty', () => {
        props.commonProperties = [{ label: 'country', type: 'text', _id: '1' }, { label: 'author', type: 'text', _id: '2' }];
        const component = (0, _enzyme.shallow)(_react.default.createElement(_MetadataTemplate.MetadataTemplate, props));
        expect(component.find(_MetadataProperty.default).length).toBe(2);
        expect(component.find(_MetadataProperty.default).at(0).props().index).toBe(-2);
        expect(component.find(_MetadataProperty.default).at(1).props().index).toBe(-1);
      });
    });

    describe('when it has properties', () => {
      it('should render all properties as MetadataProperty', () => {
        props.properties = [{ label: 'country', type: 'text', _id: '1' }, { label: 'author', type: 'text', _id: '2' }];
        props.commonProperties = [];
        const component = (0, _enzyme.shallow)(_react.default.createElement(_MetadataTemplate.MetadataTemplate, props));
        expect(component.find(_MetadataProperty.default).length).toBe(2);
      });
    });
  });

  describe('onSubmit', () => {
    it('should thrim the properties labels and then call props.saveTemplate', () => {
      const component = (0, _enzyme.shallow)(_react.default.createElement(_MetadataTemplate.MetadataTemplate, props));
      const template = { properties: [
        { label: ' trim me please ' }] };

      component.instance().onSubmit(template);
      expect(props.saveTemplate).toHaveBeenCalledWith({ properties: [{ label: 'trim me please' }] });
    });
  });

  describe('dropTarget', () => {
    const actions = jasmine.createSpyObj('actions', ['inserted', 'addProperty']);
    let backend;
    let component;
    let monitor;

    beforeEach(() => {
      const TestDragAndDropContext = sourceTargetTestContext(_MetadataTemplate.dropTarget, _PropertyOption.dragSource, actions);
      component = renderComponent(TestDragAndDropContext, {}, [{ label: '', type: 'text' }]);
      backend = component.getManager().getBackend();
      monitor = component.getManager().getMonitor();
    });

    describe('when droping', () => {
      it('should addField on the last index', () => {
        const target = _testUtils.default.findRenderedComponentWithType(component, _MetadataTemplate.dropTarget);
        const source = _testUtils.default.findRenderedComponentWithType(component, _PropertyOption.dragSource);

        backend.simulateBeginDrag([source.getHandlerId()]);
        backend.simulateHover([target.getHandlerId()]);
        backend.simulateDrop();

        const lastIndex = 1;
        expect(actions.addProperty).toHaveBeenCalledWith({ label: 'source', type: 'type' }, lastIndex);
      });
    });

    describe('when droping a property that is being inserted', () => {
      it('should updateProperty removing "inserting" flag on item index', () => {
        const target = _testUtils.default.findRenderedComponentWithType(component, _MetadataTemplate.dropTarget);
        const source = _testUtils.default.findRenderedComponentWithType(component, _PropertyOption.dragSource);
        const index = 0;

        backend.simulateBeginDrag([source.getHandlerId()]);
        monitor.getItem().index = index;
        backend.simulateHover([target.getHandlerId()]);
        backend.simulateDrop();

        expect(actions.inserted).toHaveBeenCalledWith(index);
      });
    });
  });

  describe('mapStateToProps', () => {
    it('should select next available template color as defaultColor for new template', () => {
      const template = { data: {}, uiState: _immutable.default.fromJS({}) };
      const templates = _immutable.default.fromJS([{ _id: 'id1' }, { _id: 'id2' }, { _id: 'id3' }]);
      const res = (0, _MetadataTemplate.mapStateToProps)({ template, templates }, {});
      expect(res.defaultColor).toMatchSnapshot();
    });
    it('should select defaultColor based on template index if template already exists', () => {
      const template = { data: { _id: 'id2' }, uiState: _immutable.default.fromJS({}) };
      const templates = _immutable.default.fromJS([{ _id: 'id1' }, { _id: 'id2' }, { _id: 'id3' }]);
      const res = (0, _MetadataTemplate.mapStateToProps)({ template, templates }, {});
      expect(res.defaultColor).toMatchSnapshot();
    });
  });
});