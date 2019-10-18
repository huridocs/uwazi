"use strict";
var _react = _interopRequireWildcard(require("react"));
var _testUtils = _interopRequireDefault(require("react-dom/test-utils"));
var _reactDndTestBackend = _interopRequireDefault(require("react-dnd-test-backend"));
var _reactDnd = require("react-dnd");
var _reactRedux = require("react-redux");
var _redux = require("redux");
var _immutable = _interopRequireDefault(require("immutable"));
var _enzyme = require("enzyme");

var _MetadataProperty = require("../MetadataProperty");
var _FormConfigMultimedia = _interopRequireDefault(require("../FormConfigMultimedia"));
var _FormConfigInput = _interopRequireDefault(require("../FormConfigInput"));
var _FormConfigSelect = _interopRequireDefault(require("../FormConfigSelect"));
var _FormConfigNested = _interopRequireDefault(require("../FormConfigNested"));
var _FormConfigRelationship = _interopRequireDefault(require("../FormConfigRelationship"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}function _extends() {_extends = Object.assign || function (target) {for (var i = 1; i < arguments.length; i++) {var source = arguments[i];for (var key in source) {if (Object.prototype.hasOwnProperty.call(source, key)) {target[key] = source[key];}}}return target;};return _extends.apply(this, arguments);}

function wrapInTestContext(DecoratedComponent) {
  return (0, _reactDnd.DragDropContext)(_reactDndTestBackend.default)(
  class TestContextContainer extends _react.Component {
    render() {
      return _react.default.createElement(DecoratedComponent, _extends({}, this.props, { errors: {} }));
    }});


}

function sourceTargetTestContext(Target, Source, actions) {
  return (0, _reactDnd.DragDropContext)(_reactDndTestBackend.default)(
  class TestContextContainer extends _react.Component {
    render() {
      const identity = x => x;
      const targetProps = {
        label: 'target',
        index: 1,
        localID: 'target',
        connectDragSource: identity,
        isDragging: false,
        uiState: _immutable.default.fromJS({}),
        templates: _immutable.default.fromJS([]),
        formState: { fields: [], $form: { errors: {} } },
        template: {
          commonProperties: [{ name: 'title', label: 'Title' }] } };


      const sourceProps = {
        label: 'source',
        type: 'type',
        index: 2,
        localID: 'source',
        connectDragSource: identity,
        isDragging: false,
        uiState: _immutable.default.fromJS({}),
        templates: _immutable.default.fromJS([]),
        formState: { fields: [], $form: { errors: {} } },
        template: {
          commonProperties: [{ name: 'title', label: 'Title' }] } };


      return (
        _jsx("div", {}, void 0,
        _react.default.createElement(Target, _extends({}, targetProps, actions)),
        _react.default.createElement(Source, sourceProps)));


    }});


}

describe('MetadataProperty', () => {
  let component;

  describe('commonProperty', () => {
    let editProperty;
    let props;
    beforeEach(() => {
      const identity = x => x;
      editProperty = jasmine.createSpy('editProperty');
      props = {
        isCommonProperty: true,
        isDragging: false,
        connectDragSource: identity,
        connectDropTarget: identity,
        label: 'test',
        type: 'propertyType',
        index: 1,
        localID: 'id',
        formState: { fields: [], $form: { errors: {} } },
        template: {
          commonProperties: [{ name: 'title', label: 'Title' }, { name: 'creationDate' }] },

        editProperty,
        uiState: _immutable.default.fromJS({ editingProperty: '' }),
        templates: _immutable.default.fromJS([]) };

    });

    const render = () => {
      component = (0, _enzyme.shallow)(_react.default.createElement(_MetadataProperty.MetadataProperty, props));
      return component;
    };

    describe('title field error', () => {
      it('should render duplicated error on title field', () => {
        props.index = -2;
        props.label = 'Title';
        props.formState.$form.errors['commonProperties.0.label.duplicated'] = true;
        render();
        expect(component).toMatchSnapshot();
      });
    });

    describe('ui actions', () => {
      describe('delete button', () => {
        it('should not be there', () => {
          component = (0, _enzyme.shallow)(_react.default.createElement(_MetadataProperty.MetadataProperty, props));
          expect(component.find('.property-remove').length).toBe(0);
        });
      });

      describe('edit button', () => {
        it('should editProperty', () => {
          component = (0, _enzyme.shallow)(_react.default.createElement(_MetadataProperty.MetadataProperty, props));
          component.find('.property-edit').simulate('click');
          expect(editProperty).toHaveBeenCalledWith('id');
        });
      });
    });
  });

  describe('simple component', () => {
    let removeProperty;
    let editProperty;
    let props;
    beforeEach(() => {
      const identity = x => x;
      removeProperty = jasmine.createSpy('removeProperty');
      editProperty = jasmine.createSpy('editProperty');
      props = {
        isDragging: true,
        connectDragSource: identity,
        connectDropTarget: identity,
        inserting: true,
        label: 'test',
        type: 'propertyType',
        index: 1,
        localID: 'id',
        formState: { fields: [], $form: { errors: {} } },
        template: {
          commonProperties: [{ name: 'title', label: 'Title' }, { name: 'creationDate' }] },

        removeProperty,
        editProperty,
        uiState: _immutable.default.fromJS({ editingProperty: '' }),
        templates: _immutable.default.fromJS([]) };


      component = (0, _enzyme.shallow)(_react.default.createElement(_MetadataProperty.MetadataProperty, props));
    });

    describe('when marked as inserting', () => {
      it('should add "dragging" className', () => {
        expect(component.find('.list-group-item').hasClass('dragging')).toBe(true);
      });
    });

    describe('FormConfigInput', () => {
      it('should pass the type to the component', () => {
        expect(component.find(_FormConfigInput.default).first().props().type).toBe('propertyType');
      });
    });

    describe('when type is custom type', () => {
      const checkMultimedia = (canSetStyle, canBeRequired) => {
        expect(component.find(_FormConfigMultimedia.default).length).toBe(1);
        expect(component.find(_FormConfigMultimedia.default).props().canSetStyle).toBe(canSetStyle);
        expect(component.find(_FormConfigMultimedia.default).props().canBeRequired).toBe(canBeRequired);
      };

      it('should render the correct component', () => {
        expect(component.find(_FormConfigInput.default).length).toBe(1);

        component.setProps({ type: 'select' });
        expect(component.find(_FormConfigSelect.default).length).toBe(1);

        component.setProps({ type: 'any' });
        expect(component.find(_FormConfigInput.default).length).toBe(1);

        component.setProps({ type: 'multiselect' });
        expect(component.find(_FormConfigSelect.default).length).toBe(1);

        component.setProps({ type: 'nested' });
        expect(component.find(_FormConfigNested.default).length).toBe(1);

        component.setProps({ type: 'relationship' });
        expect(component.find(_FormConfigRelationship.default).length).toBe(1);

        component.setProps({ type: 'image' });
        checkMultimedia(true, true);

        component.setProps({ type: 'preview' });
        checkMultimedia(true, false);

        component.setProps({ type: 'media' });
        checkMultimedia(false, true);

        component.setProps({ type: 'geolocation' });
        expect(component.find(_FormConfigInput.default).length).toBe(1);
        expect(component.find(_FormConfigInput.default).props().canBeFilter).toBe(false);
      });

      describe('errors', () => {
        it('should render duplicated relation error', () => {
          props.formState.$form.errors['properties.1.relationType.duplicated'] = true;
          component = (0, _enzyme.shallow)(_react.default.createElement(_MetadataProperty.MetadataProperty, props));
          expect(component).toMatchSnapshot();
        });

        it('should render duplicated label error', () => {
          props.formState.$form.errors['properties.1.label.duplicated'] = true;
          component = (0, _enzyme.shallow)(_react.default.createElement(_MetadataProperty.MetadataProperty, props));
          expect(component).toMatchSnapshot();
        });
      });
    });

    describe('ui actions', () => {
      describe('delete button', () => {
        it('should removeProperty', () => {
          component.find('.property-remove').simulate('click');
          expect(removeProperty).toHaveBeenCalledWith('RemovePropertyModal', 1);
        });
      });

      describe('edit button', () => {
        it('should editProperty', () => {
          component.find('.property-edit').simulate('click');
          expect(editProperty).toHaveBeenCalledWith('id');
        });
      });
    });
  });

  describe('drag and drop', () => {
    let backend;
    let monitor;
    let store;

    function renderComponent(ComponentToRender, props) {
      let result;
      const templateData = {
        name: '',
        commonProperties: [{ name: 'title', label: 'Title' }],
        properties: [{ label: '', type: 'text' }, { label: '', type: 'text' }, { label: '', type: 'text' }] };

      store = (0, _redux.createStore)(() => ({
        template: {
          data: templateData,
          uiState: _immutable.default.fromJS({ templates: [] }),
          formState: { fields: [], errors: {} } },

        templates: _immutable.default.fromJS([]),
        modals: _immutable.default.fromJS({}) }));

      _testUtils.default.renderIntoDocument(_jsx(_reactRedux.Provider, { store: store }, void 0, _react.default.createElement(ComponentToRender, _extends({ ref: ref => result = ref }, props, { index: 0 }))));
      return result;
    }

    describe('dragSource', () => {
      beforeEach(() => {
        const TestComponent = wrapInTestContext(_MetadataProperty.dragSource);
        component = renderComponent(TestComponent, {
          label: 'test',
          type: 'type',
          index: 0,
          localID: 'id',
          uiState: _immutable.default.fromJS({}),
          formState: { fields: [], $form: { errors: {} } },
          template: {
            commonProperties: [{ name: 'title', label: 'Title' }] } });


        backend = component.getManager().getBackend();
        monitor = component.getManager().getMonitor();
      });

      describe('beginDrag', () => {
        it('should return an object with name', () => {
          const option = _testUtils.default.findRenderedComponentWithType(component, _MetadataProperty.dragSource);
          backend.simulateBeginDrag([option.getHandlerId()]);
          expect(monitor.getItem()).toEqual({ index: 0, label: 'test', type: 'type' });
        });

        it('should add "dragging" class name', () => {
          const option = _testUtils.default.findRenderedComponentWithType(component, _MetadataProperty.dragSource);
          const div = _testUtils.default.scryRenderedDOMComponentsWithTag(option, 'div')[0];

          expect(div.className).not.toContain('dragging');
          backend.simulateBeginDrag([option.getHandlerId()]);
          expect(div.className).toContain('dragging');
        });
      });
    });

    describe('dropTarget', () => {
      const actions = jasmine.createSpyObj(['reorderProperty', 'addProperty']);
      beforeEach(() => {
        const TestDragAndDropContext = sourceTargetTestContext(_MetadataProperty.dropTarget, _MetadataProperty.dragSource, actions);
        component = renderComponent(TestDragAndDropContext);
        backend = component.getManager().getBackend();
        monitor = component.getManager().getMonitor();
      });

      describe('when reordering', () => {
        it('should call reorder with drag and hover indexes', () => {
          const target = _testUtils.default.scryRenderedComponentsWithType(component, _MetadataProperty.dropTarget)[0];
          const source = _testUtils.default.findRenderedComponentWithType(component, _MetadataProperty.dragSource);

          backend.simulateBeginDrag([source.getHandlerId()]);
          backend.simulateHover([target.getHandlerId()]);

          expect(actions.reorderProperty).toHaveBeenCalledWith(2, 1);
        });
      });

      describe('when inserting', () => {
        it('should call addProperty with inserting flag and on index 0', () => {
          const target = _testUtils.default.scryRenderedComponentsWithType(component, _MetadataProperty.dropTarget)[0];
          const source = _testUtils.default.findRenderedComponentWithType(component, _MetadataProperty.dragSource);

          backend.simulateBeginDrag([source.getHandlerId()]);
          delete monitor.getItem().index;
          backend.simulateHover([target.getHandlerId()]);

          expect(monitor.getItem().index).toBe(0);
          expect(actions.addProperty).toHaveBeenCalledWith({ label: 'source', type: 'type', inserting: true }, 0);
        });
      });
    });
  });
});