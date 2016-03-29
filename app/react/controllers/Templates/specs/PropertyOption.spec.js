import React, {Component} from 'react';
import TestUtils from 'react-addons-test-utils';
import TestBackend from 'react-dnd-test-backend';
import {DragDropContext} from 'react-dnd';
import {Provider} from 'react-redux';
import {createStore} from 'redux';

import PropertyOption, {dragSource as dragSourceOption} from '~/controllers/Templates/PropertyOption';

function wrapInTestContext(DecoratedComponent) {
  return DragDropContext(TestBackend)(
    class TestContextContainer extends Component {
      render() {
        return <DecoratedComponent {...this.props} />;
      }
    }
  );
}


describe('PropertyOption', () => {
  let backend;
  let monitor;
  let store;
  let TestComponent;
  let component;

  function renderComponent(ComponentToRender, props) {
    let result;
    store = createStore(() => {});
    TestUtils.renderIntoDocument(<Provider store={store}><ComponentToRender ref={(ref) => result = ref} {...props}/></Provider>);
    return result;
  }

  describe('PropertyOption', () => {
    fit('should have mapped removeProperty action into props', () => {
      TestComponent = wrapInTestContext(PropertyOption);
      component = renderComponent(TestComponent, {name: 'test'});
      let option = TestUtils.findRenderedComponentWithType(component, PropertyOption).getWrappedInstance();
      expect(option.props.removeProperty).toEqual(jasmine.any(Function));
    });
  });

  describe('DragSource', () => {
    beforeEach(() => {
      TestComponent = wrapInTestContext(dragSourceOption);
      component = renderComponent(TestComponent, {name: 'test'});
      backend = component.getManager().getBackend();
      monitor = component.getManager().getMonitor();
    });

    describe('beginDrag', () => {
      fit('should return an object with name', () => {
        let option = TestUtils.findRenderedComponentWithType(component, dragSourceOption);
        backend.simulateBeginDrag([option.getHandlerId()]);
        expect(monitor.getItem()).toEqual({name: 'test'});
      });
    });

    describe('endDrag', () => {
      describe('when not droped on a target and item has an index', () => {
        fit('should call REMOVE_FIELD with the index', () => {
          let props = {name: 'test', removeProperty: jasmine.createSpy()};
          component = renderComponent(TestComponent, props);
          backend = component.getManager().getBackend();
          monitor = component.getManager().getMonitor();

          let option = TestUtils.findRenderedComponentWithType(component, dragSourceOption);
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
