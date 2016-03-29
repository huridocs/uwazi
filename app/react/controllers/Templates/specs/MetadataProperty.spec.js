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

function wrapInTestContext2(Target, Source, actions) {
  return DragDropContext(TestBackend)(
    class TestContextContainer extends Component {
      render() {
        const identity = x => x;
        let targetProps = {name: 'test', index: 1, id: 'target', connectDragSource: identity, isDragging: false};
        let sourceProps = {name: 'test', index: 2, id: 'source', connectDragSource: identity, isDragging: false};
        return <div>
                <Target {...targetProps} {...actions}/>
                <Source {...sourceProps} />
              </div>;
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
    it('should have mapped action into props', () => {
      TestComponent = wrapInTestContext(MetadataProperty);
      component = renderComponent(TestComponent, {name: 'test', index: 1, id: 'id'});
      let option = TestUtils.findRenderedComponentWithType(component, MetadataProperty).getWrappedInstance();
      expect(option.props.reorderProperty).toEqual(jasmine.any(Function));
      expect(option.props.addProperty).toEqual(jasmine.any(Function));
    });

    describe('when inserting', () => {
      it('should add "dragging" className', () => {
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
      it('should return an object with name', () => {
        let option = TestUtils.findRenderedComponentWithType(component, dragSource);
        backend.simulateBeginDrag([option.getHandlerId()]);
        expect(monitor.getItem()).toEqual({index: 1});
      });

      it('should add "dragging" class name', () => {
        let option = TestUtils.findRenderedComponentWithType(component, dragSource);
        let div = TestUtils.findRenderedDOMComponentWithTag(option, 'div');

        expect(div.className).not.toContain('dragging');
        backend.simulateBeginDrag([option.getHandlerId()]);
        expect(div.className).toContain('dragging');
      });
    });
  });

  fdescribe('dropTarget', () => {
    let actions = jasmine.createSpyObj(['reorderProperty', 'addProperty']);

    beforeEach(() => {
      let TestDragAndDropContext = wrapInTestContext2(dropTarget, dragSource, actions);
      component = renderComponent(TestDragAndDropContext);
      backend = component.getManager().getBackend();
      monitor = component.getManager().getMonitor();
    });

    it('shoudld be true', () => {
      let target = TestUtils.scryRenderedComponentsWithType(component, dropTarget)[0];
      let source = TestUtils.findRenderedComponentWithType(component, dragSource);

      backend.simulateBeginDrag([source.getHandlerId()]);
      backend.simulateHover([target.getHandlerId()]);

      expect(actions.reorderProperty).toHaveBeenCalledWith(2, 1);
    });
  });
});
