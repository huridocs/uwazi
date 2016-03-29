import React, {Component} from 'react';
import TestUtils from 'react-addons-test-utils';
import TestBackend from 'react-dnd-test-backend';
import {DragDropContext} from 'react-dnd';
import {Provider} from 'react-redux';
import {createStore} from 'redux';

import MetadataProperty, {dragSource, dropTarget} from '~/controllers/Templates/MetadataProperty';

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

  describe('MetadataProperty', () => {
    fit('should have mapped action into props', () => {
      TestComponent = wrapInTestContext(MetadataProperty);
      component = renderComponent(TestComponent, {name: 'test', index: 1, id: 'id'});
      let option = TestUtils.findRenderedComponentWithType(component, MetadataProperty).getWrappedInstance();
      expect(option.props.reorderProperty).toEqual(jasmine.any(Function));
      expect(option.props.addProperty).toEqual(jasmine.any(Function));
    });

    describe('when inserting', () => {
      fit('should add "dragging" className', () => {
        component = renderComponent(TestComponent, {inserting: true, name: 'test', index: 1, id: 'id'});
        let option = TestUtils.findRenderedComponentWithType(component, dragSource);
        let div = TestUtils.findRenderedDOMComponentWithTag(option, 'div');

        expect(div.className).toContain('dragging');
      });
    });
  });

  describe('dragSource', () => {
    beforeEach(() => {
      TestComponent = wrapInTestContext(dragSource);
      component = renderComponent(TestComponent, {name: 'test', index: 1, id: 'id'});
      backend = component.getManager().getBackend();
      monitor = component.getManager().getMonitor();
    });

    describe('beginDrag', () => {
      fit('should return an object with name', () => {
        let option = TestUtils.findRenderedComponentWithType(component, dragSource);
        backend.simulateBeginDrag([option.getHandlerId()]);
        expect(monitor.getItem()).toEqual({index: 1});
      });

      fit('should add "dragging" class name', () => {
        let option = TestUtils.findRenderedComponentWithType(component, dragSource);
        let div = TestUtils.findRenderedDOMComponentWithTag(option, 'div');

        expect(div.className).not.toContain('dragging');
        backend.simulateBeginDrag([option.getHandlerId()]);
        expect(div.className).toContain('dragging');
      });
    });
  });

  describe('dropTarget', () => {
    let sourceComponent;
    let registry;

    beforeEach(() => {
      let TestDropComponent = wrapInTestContext(dropTarget);
      let TestSourceComponent = wrapInTestContext(dragSource);
      const identity = x => x;
      component = renderComponent(TestDropComponent, {name: 'test', index: 1, id: 'id', connectDragSource: identity, isDragging: false});
      sourceComponent = renderComponent(TestSourceComponent, {name: 'test', index: 1, id: 'id', connectDragSource: identity, isDragging: false});
      backend = sourceComponent.getManager().getBackend();
      monitor = component.getManager().getMonitor();
      registry = component.getManager().getRegistry();
    });

    // fit('shoudld be true', () => {
    //   let target = TestUtils.findRenderedComponentWithType(component, dropTarget);
    //   let source = TestUtils.findRenderedComponentWithType(sourceComponent, dragSource);
    //
    //   let targetId = registry.addTarget('METADATA_PROPERTY', new dropTarget());
    //
    //   // backend.simulateBeginDrag([source.getHandlerId()]);
    //   // backend.simulateHover([targetId]);
    //   // backend.simulateDrop();
    //   // backend.simulateEndDrag();
    // });
  });
});
