"use strict";var _react = _interopRequireDefault(require("react"));
var _enzyme = require("enzyme");
var _uniqueID = require("../../../../shared/uniqueID");
var _DragAndDropContainer = require("../DragAndDropContainer");
var _DragAndDropItem = _interopRequireDefault(require("../DragAndDropItem"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var REACT_ELEMENT_TYPE;function _jsx(type, props, key, children) {if (!REACT_ELEMENT_TYPE) {REACT_ELEMENT_TYPE = typeof Symbol === "function" && Symbol["for"] && Symbol["for"]("react.element") || 0xeac7;}var defaultProps = type && type.defaultProps;var childrenLength = arguments.length - 3;if (!props && childrenLength !== 0) {props = { children: void 0 };}if (props && defaultProps) {for (var propName in defaultProps) {if (props[propName] === void 0) {props[propName] = defaultProps[propName];}}} else if (!props) {props = defaultProps || {};}if (childrenLength === 1) {props.children = children;} else if (childrenLength > 1) {var childArray = new Array(childrenLength);for (var i = 0; i < childrenLength; i++) {childArray[i] = arguments[i + 3];}props.children = childArray;}return { $$typeof: REACT_ELEMENT_TYPE, type: type, key: key === undefined ? null : '' + key, ref: null, props: props, _owner: null };}

describe('DragAndDropContainer', () => {
  describe('react component', () => {
    let component;
    let props;
    let items;
    beforeEach(() => {
      items = [
      { content: 'A rude awakening', id: 1 },
      { content: 'A nice awakening', id: 2 }];

      props = {
        connectDropTarget: jasmine.createSpy('connectDropTarget').and.callFake(value => value),
        items,
        onChange: jasmine.createSpy('onChange') };

      (0, _uniqueID.mockID)();
    });

    const render = () => {
      component = (0, _enzyme.shallow)(_react.default.createElement(_DragAndDropContainer.DragAndDropContainer, props));
    };

    it('should render a DragAndDropItem for each item', () => {
      render();
      expect(component.find(_DragAndDropItem.default).length).toBe(2);
      expect(component.find(_DragAndDropItem.default).first().props().originalItem).toEqual(items[0]);
      expect(component.find(_DragAndDropItem.default).first().props().children(items[0])).toBe('A rude awakening');
    });

    it('should enable iconHandle on children if iconHandle is enabled in container', () => {
      props.iconHandle = true;
      render();
      expect(component).toMatchSnapshot();
    });

    it('should enable iconHandle for child that has nested items property', () => {
      items[0].items = [{ id: 3, content: 'sub item' }];
      render();
      expect(component).toMatchSnapshot();
    });

    describe('accepts a custom render function', () => {
      beforeEach(() => {
        props.renderItem = jest.fn().mockImplementation((item, index) => _jsx("span", {}, void 0, "Avocado ", item.content, " ", index));
      });
      it('to render items', () => {
        render();
        component.instance().renderItem(items[0], 0);
        expect(props.renderItem).toHaveBeenCalledWith(items[0], 0);
      });
    });

    describe('when an item moves', () => {
      it('should reorder the items and call onChange', () => {
        render();
        component.instance().moveItem(1, 0, items[1]);
        expect(props.onChange).toHaveBeenCalledWith([{ content: 'A nice awakening', id: 2 }, { content: 'A rude awakening', id: 1 }]);
      });

      describe('when the item does not belong to the container', () => {
        it('should do nothing', () => {
          render();
          component.instance().moveItem(1, 0, { id: 27 });
          expect(props.onChange).not.toHaveBeenCalled();
        });
      });
    });

    describe('removeItem', () => {
      it('should remove the item and call onChange', () => {
        render();
        component.instance().removeItem(1);
        expect(props.onChange).toHaveBeenCalledWith([{ content: 'A nice awakening', id: 2 }]);
      });
    });
  });

  describe('containerTarget', () => {
    describe('drop', () => {
      it('should return the container id', () => {
        const monitor = {
          getItem: () => ({ id: 1 }),
          getDropResult: () => {} };


        const component = { state: { id: 'container_id' } };
        const props = {
          items: [{ id: 1 }],
          onChange: jasmine.createSpy('onChange') };

        const dropResult = _DragAndDropContainer.containerTarget.drop(props, monitor, component);
        expect(dropResult).toEqual({ id: 'container_id' });
        expect(props.onChange).not.toHaveBeenCalled();
      });

      it('should add the item if missing', () => {
        const monitor = {
          getItem: () => ({ id: 1 }),
          getDropResult: () => {} };

        const component = { state: { id: 'container_id' } };
        const props = {
          items: [],
          onChange: jasmine.createSpy('onChange') };

        _DragAndDropContainer.containerTarget.drop(props, monitor, component);
        expect(props.onChange).toHaveBeenCalledWith([{ id: 1 }]);
      });

      it('should NOT add the item if other container handles the drop', () => {
        const monitor = {
          getItem: () => ({ id: 1 }),
          getDropResult: () => ({ id: 'I_handle_this' }) };

        const component = { state: { id: 'container_id' } };
        const props = {
          items: [],
          onChange: jasmine.createSpy('onChange') };

        _DragAndDropContainer.containerTarget.drop(props, monitor, component);
        expect(props.onChange).not.toHaveBeenCalled();
      });
    });
  });
});