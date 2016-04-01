import React, {Component} from 'react';
import TestUtils from 'react-addons-test-utils';
import TestBackend from 'react-dnd-test-backend';
import {DragDropContext} from 'react-dnd';
import {Provider} from 'react-redux';
import {createStore} from 'redux';
import Immutable from 'immutable';
import {reducer as formReducer} from 'redux-form';

import MetadataTemplate, {MetadataTemplate as DumbComponent, dropTarget} from '~/Templates/components/MetadataTemplate';
import MetadataProperty, {dropTarget as MetadataTarget} from '~/Templates/components/MetadataProperty';
import {dragSource} from '~/Templates/components/PropertyOption';

function sourceTargetTestContext(Target, Source, actions) {
  return DragDropContext(TestBackend)(
    class TestContextContainer extends Component {
      render() {
        const identity = x => x;
        let properties = [{label: 'childTarget', id: 'childId', inserting: true}];
        let targetProps = {properties: properties, connectDropTarget: identity};
        let sourceProps = {label: 'source', index: 2, id: 'source', connectDragSource: identity};
        return <div>
                <Target {...targetProps} {...actions}/>
                <Source {...sourceProps} />
              </div>;
      }
    }
  );
}

function wrapInTestContext(DecoratedComponent) {
  return DragDropContext(TestBackend)(
    class TestContextContainer extends Component {
      render() {
        return <DecoratedComponent {...this.props} />;
      }
    }
  );
}

describe('MetadataTemplate', () => {
  function renderComponent(ComponentToRender, props = {}, properties = []) {
    let result;
    let templateData = Immutable.fromJS({name: '', properties: properties});
    let store = createStore(() => {
      return {
        template: {data: templateData, uiState: Immutable.fromJS({})},
        form: formReducer
      };
    });
    TestUtils.renderIntoDocument(<Provider store={store}><ComponentToRender ref={(ref) => result = ref} {...props}/></Provider>);
    return result;
  }

  let TestComponent;
  beforeEach(() => {
    TestComponent = wrapInTestContext(MetadataTemplate);
  });

  it('should have mapped actions into props', () => {
    let component = renderComponent(TestComponent);
    let template = TestUtils.findRenderedComponentWithType(component, MetadataTemplate).getWrappedInstance();

    expect(template.props.updateProperty).toEqual(jasmine.any(Function));
    expect(template.props.addProperty).toEqual(jasmine.any(Function));
  });

  it('should have mapped store into props', () => {
    let component = renderComponent(TestComponent, null, [{label: 'field', id: 'id2'}]);
    let wrappedComponent = TestUtils.findRenderedComponentWithType(component, MetadataTemplate).getWrappedInstance();

    expect(wrappedComponent.props.properties).toEqual([{label: 'field', id: 'id2'}]);
  });

  describe('render()', () => {
    describe('when fields is empty', () => {
      it('should render a blank state', () => {
        let component = renderComponent(TestComponent, {label: 'test', index: 1, id: 'id'});
        let blankState = TestUtils.findRenderedDOMComponentWithClass(component, 'no-properties');

        expect(blankState.innerHTML).toContain('start');
      });
    });

    it('should add isOver className to the span when isOver', () => {
      let props = {properties: [], isOver: false, connectDropTarget: (x) => x};
      let component = TestUtils.renderIntoDocument(<DumbComponent {...props}/>);
      TestUtils.findRenderedDOMComponentWithClass(component, 'no-properties');

      props = {properties: [], isOver: true, connectDropTarget: (x) => x};
      component = TestUtils.renderIntoDocument(<DumbComponent {...props}/>);
      TestUtils.findRenderedDOMComponentWithClass(component, 'no-properties isOver');
    });

    describe('when has fields', () => {
      it('should render all fields as MetadataProperty', () => {
        let component = renderComponent(TestComponent,
          {properties: []}, [{label: 'property1', id: '1'}, {label: 'property2', id: '2'}]
        );
        let properties = TestUtils.scryRenderedComponentsWithType(component, MetadataProperty);

        expect(properties.length).toBe(2);
      });
    });
  });

  describe('dropTarget', () => {
    let actions = jasmine.createSpyObj(['updateProperty', 'addProperty']);
    let backend;
    let component;

    beforeEach(() => {
      let TestDragAndDropContext = sourceTargetTestContext(dropTarget, dragSource, actions);
      component = renderComponent(TestDragAndDropContext);
      backend = component.getManager().getBackend();
    });

    describe('when droping', () => {
      it('should addField on index 0', () => {
        let target = TestUtils.findRenderedComponentWithType(component, dropTarget);
        let source = TestUtils.findRenderedComponentWithType(component, dragSource);

        backend.simulateBeginDrag([source.getHandlerId()]);
        backend.simulateHover([target.getHandlerId()]);
        backend.simulateDrop();

        expect(actions.addProperty).toHaveBeenCalledWith({label: 'source'}, 0);
      });
    });

    describe('when droping on a child', () => {
      it('should updateProperty removing "inserting" flag on item index', () => {
        let target = TestUtils.findRenderedComponentWithType(component, dropTarget);
        let childTarget = TestUtils.findRenderedComponentWithType(component, MetadataTarget);
        let source = TestUtils.findRenderedComponentWithType(component, dragSource);

        backend.simulateBeginDrag([source.getHandlerId()]);
        backend.simulateHover([target.getHandlerId(), childTarget.getHandlerId()]);
        backend.simulateDrop();

        expect(actions.updateProperty).toHaveBeenCalledWith({label: 'childTarget', id: 'childId', inserting: null}, 0);
      });
    });
  });
});
