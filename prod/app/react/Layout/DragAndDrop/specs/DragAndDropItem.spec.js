"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _DragAndDropItem = require("../DragAndDropItem");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

describe('DragAndDropItem', () => {
  describe('react component', () => {
    let component;
    let props;
    beforeEach(() => {
      props = {
        connectDragSource: jasmine.createSpy('connectDragSource').and.callFake(value => value),
        connectDropTarget: jasmine.createSpy('connectDropTarget').and.callFake(value => value),
        connectDragPreview: jasmine.createSpy('connectDragPreview'),
        index: 1,
        isDragging: false,
        id: 1,
        originalItem: { label: 'item1' },
        moveItem: jasmine.createSpy('moveItem'),
        children: (item, index) => _jsx("span", {}, void 0, "Showing item ", item.label, " ", index) };

    });

    const render = () => {
      component = (0, _enzyme.shallow)(_react.default.createElement(_DragAndDropItem.DragAndDropItem, props));
    };

    it('should render item using children prop as render function', () => {
      render();
      expect(component).toMatchSnapshot();
    });

    it('should connect the component to the dragSource and dragTarget', () => {
      render();
      expect(props.connectDragSource).toHaveBeenCalled();
      expect(props.connectDropTarget).toHaveBeenCalled();
    });

    describe('when is dragging', () => {
      it('should add the class dragging to it', () => {
        props.isDragging = true;
        render();
        expect(component.find('div').hasClass('dragging')).toBe(true);
      });
    });
  });
});