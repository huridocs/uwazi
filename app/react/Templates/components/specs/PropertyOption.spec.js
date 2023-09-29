/**
 * @jest-environment jsdom
 */
import React from 'react';
import TestUtils from 'react-dom/test-utils';
import { createStore } from 'redux';
import { TestBackend } from 'react-dnd-test-backend';
import { DragDropContext } from 'react-dnd-old';
import { Provider } from 'react-redux';
import Immutable from 'immutable';
import PropertyOption, {
  dragSource as dragSourceOption,
} from 'app/Templates/components/PropertyOption';

function wrapInTestContext(DecoratedComponent) {
  return DragDropContext(TestBackend)(DecoratedComponent);
}

describe('PropertyOption', () => {
  let backend;
  let monitor;
  let store;
  let TestComponent;
  let component;
  let item;

  function renderComponent(ComponentToRender, props) {
    let result;
    store = createStore(() => ({
      translations: Immutable.fromJS([{ locale: 'en' }]),
      inlineEdit: Immutable.fromJS({ inlineEdit: false }),
    }));
    TestUtils.renderIntoDocument(
      <Provider store={store}>
        <ComponentToRender ref={ref => (result = ref)} {...props} />
      </Provider>
    );
    return result;
  }

  describe('PropertyOption', () => {
    it('should have mapped removeProperty action into props', () => {
      TestComponent = wrapInTestContext(PropertyOption);
      component = renderComponent(TestComponent, {
        label: 'test',
        type: 'optionType',
        addProperty: () => {},
      });
      const option = TestUtils.findRenderedComponentWithType(
        component,
        PropertyOption
      ).getWrappedInstance();
      expect(option.props.removeProperty).toEqual(jasmine.any(Function));
    });

    it('should not add a property when clicked if disabled', () => {
      const props = {
        label: 'test',
        disabled: true,
        type: 'optionType',
        addProperty: jasmine.createSpy().and.returnValue({}),
      };
      TestComponent = wrapInTestContext(dragSourceOption);
      component = renderComponent(TestComponent, props);
      const button = TestUtils.findRenderedDOMComponentWithTag(component, 'button');
      TestUtils.Simulate.click(button);
      expect(props.addProperty).not.toHaveBeenCalled();
    });

    it('should add a property when clicked', () => {
      const props = {
        label: 'test',
        type: 'optionType',
        addProperty: jasmine.createSpy().and.returnValue({}),
      };
      TestComponent = wrapInTestContext(dragSourceOption);
      component = renderComponent(TestComponent, props);
      const button = TestUtils.findRenderedDOMComponentWithTag(component, 'button');
      TestUtils.Simulate.click(button);
      expect(props.addProperty).toHaveBeenCalledWith({ label: 'test', type: 'optionType' });
    });
  });

  describe('DragSource', () => {
    beforeEach(() => {
      item = { label: 'test', type: 'optionType', addProperty: () => {} };
      TestComponent = wrapInTestContext(dragSourceOption);
      component = renderComponent(TestComponent, item);
      backend = component.getManager().getBackend();
      monitor = component.getManager().getMonitor();
    });

    describe('beginDrag', () => {
      it('should return an object with name', () => {
        const option = TestUtils.findRenderedComponentWithType(component, dragSourceOption);
        backend.simulateBeginDrag([option.getHandlerId()]);
        expect(monitor.getItem()).toEqual(item);
      });
    });

    describe('endDrag', () => {
      describe('when item has no index', () => {
        it('should not call REMOVE_FIELD', () => {
          const props = {
            label: 'test',
            removeProperty: jasmine.createSpy(),
            type: 'optionType',
            addProperty: () => {},
          };
          component = renderComponent(TestComponent, props);
          backend = component.getManager().getBackend();
          monitor = component.getManager().getMonitor();

          const option = TestUtils.findRenderedComponentWithType(component, dragSourceOption);
          backend.simulateBeginDrag([option.getHandlerId()]);
          monitor.getItem().index = null;
          backend.simulateDrop();
          backend.simulateEndDrag([option.getHandlerId()]);

          expect(props.removeProperty).not.toHaveBeenCalled();
        });
      });
      describe('when not droped on a target and item has an index', () => {
        it('should call REMOVE_FIELD with the index', () => {
          const props = {
            label: 'test',
            removeProperty: jasmine.createSpy(),
            type: 'optionType',
            addProperty: () => {},
          };
          component = renderComponent(TestComponent, props);
          backend = component.getManager().getBackend();
          monitor = component.getManager().getMonitor();

          const option = TestUtils.findRenderedComponentWithType(component, dragSourceOption);
          backend.simulateBeginDrag([option.getHandlerId()]);
          monitor.getItem().index = 1;
          backend.simulateDrop();
          backend.simulateEndDrag([option.getHandlerId()]);

          expect(props.removeProperty).toHaveBeenCalledWith(1);
        });
      });
    });
  });
});
