/* eslint-disable react/no-multi-comp */
import React, { Component } from 'react';
import TestUtils from 'react-dom/test-utils';
import TestBackend from 'react-dnd-test-backend';
import { DragDropContext } from 'react-dnd';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import Immutable from 'immutable';
import { shallow } from 'enzyme';

import { MetadataProperty, dragSource, dropTarget } from 'app/Templates/components/MetadataProperty';
import FormConfigInput from 'app/Templates/components/FormConfigInput';
import FormConfigSelect from 'app/Templates/components/FormConfigSelect';
import FormConfigNested from 'app/Templates/components/FormConfigNested';
import FormConfigCommon from 'app/Templates/components/FormConfigCommon';
import FormConfigRelationship from 'app/Templates/components/FormConfigRelationship';

function wrapInTestContext(DecoratedComponent) {
  return DragDropContext(TestBackend)(
    class TestContextContainer extends Component {
      render() {
        return <DecoratedComponent {...this.props} errors={{}}/>;
      }
    }
  );
}

function sourceTargetTestContext(Target, Source, actions) {
  return DragDropContext(TestBackend)(
    class TestContextContainer extends Component {
      render() {
        const identity = x => x;
        const targetProps = {
          label: 'target',
          index: 1,
          localID: 'target',
          connectDragSource: identity,
          isDragging: false,
          uiState: Immutable.fromJS({}),
          templates: Immutable.fromJS([]),
          formState: { fields: [], $form: { errors: {} } }
        };
        const sourceProps = {
          label: 'source',
          type: 'type',
          index: 2,
          localID: 'source',
          connectDragSource: identity,
          isDragging: false,
          uiState: Immutable.fromJS({}),
          templates: Immutable.fromJS([]),
          formState: { fields: [], $form: { errors: {} } }
        };
        return (
          <div>
            <Target {...targetProps} {...actions}/>
            <Source {...sourceProps} />
          </div>
        );
      }
    }
  );
}

describe('MetadataProperty', () => {
  let component;

  describe('commonProperty', () => {
    let editProperty;
    beforeEach(() => {
      const identity = x => x;
      editProperty = jasmine.createSpy('editProperty');
      const props = {
        isCommonProperty: true,
        isDragging: false,
        connectDragSource: identity,
        connectDropTarget: identity,
        label: 'test',
        type: 'propertyType',
        index: 1,
        localID: 'id',
        formState: { fields: [], $form: { errors: {} } },
        editProperty,
        uiState: Immutable.fromJS({ editingProperty: '' }),
        templates: Immutable.fromJS([])
      };

      component = shallow(<MetadataProperty {...props}/>);
    });

    describe('ui actions', () => {
      describe('delete button', () => {
        it('should be disabled', () => {
          expect(component.find('.property-remove').props().disabled).toBe(true);
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

  describe('simple component', () => {
    let removeProperty;
    let editProperty;
    beforeEach(() => {
      const identity = x => x;
      removeProperty = jasmine.createSpy('removeProperty');
      editProperty = jasmine.createSpy('editProperty');
      const props = {
        isDragging: true,
        connectDragSource: identity,
        connectDropTarget: identity,
        inserting: true,
        label: 'test',
        type: 'propertyType',
        index: 1,
        localID: 'id',
        formState: { fields: [], $form: { errors: {} } },
        removeProperty,
        editProperty,
        uiState: Immutable.fromJS({ editingProperty: '' }),
        templates: Immutable.fromJS([])
      };

      component = shallow(<MetadataProperty {...props}/>);
    });

    describe('when marked as inserting', () => {
      it('should add "dragging" className', () => {
        expect(component.find('.list-group-item').hasClass('dragging')).toBe(true);
      });
    });

    describe('FormConfigInput', () => {
      it('should pass the type to the component', () => {
        expect(component.find(FormConfigInput).first().props().type).toBe('propertyType');
      });
    });

    describe('when type is select or list', () => {
      it('should render FormConfigSelect', () => {
        expect(component.find(FormConfigInput).length).toBe(1);

        component.setProps({ type: 'select' });
        expect(component.find(FormConfigSelect).length).toBe(1);

        component.setProps({ type: 'any' });
        expect(component.find(FormConfigInput).length).toBe(1);

        component.setProps({ type: 'multiselect' });
        expect(component.find(FormConfigSelect).length).toBe(1);

        component.setProps({ type: 'nested' });
        expect(component.find(FormConfigNested).length).toBe(1);

        component.setProps({ type: 'relationship' });
        expect(component.find(FormConfigRelationship).length).toBe(1);

        component.setProps({ type: 'geolocation' });
        expect(component.find(FormConfigInput).length).toBe(1);
        expect(component.find(FormConfigInput).props().canBeFilter).toBe(false);
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
      const templateData = { name: '', properties: [{ label: '', type: 'text' }, { label: '', type: 'text' }, { label: '', type: 'text' }] };
      store = createStore(() => ({
          template: {
            data: templateData,
            uiState: Immutable.fromJS({ templates: [] }),
            formState: { fields: [], errors: {} }
        },
          templates: Immutable.fromJS([]),
          modals: Immutable.fromJS({})
      }));
      TestUtils.renderIntoDocument(<Provider store={store}><ComponentToRender ref={ref => result = ref} {...props} index={0}/></Provider>);
      return result;
    }

    describe('dragSource', () => {
      beforeEach(() => {
        const TestComponent = wrapInTestContext(dragSource);
        component = renderComponent(TestComponent, {
          label: 'test',
          type: 'type',
          index: 0,
          localID: 'id',
          uiState: Immutable.fromJS({}),
          formState: { fields: [], $form: { errors: {} } } });
        backend = component.getManager().getBackend();
        monitor = component.getManager().getMonitor();
      });

      describe('beginDrag', () => {
        it('should return an object with name', () => {
          const option = TestUtils.findRenderedComponentWithType(component, dragSource);
          backend.simulateBeginDrag([option.getHandlerId()]);
          expect(monitor.getItem()).toEqual({ index: 0, label: 'test', type: 'type' });
        });

        it('should add "dragging" class name', () => {
          const option = TestUtils.findRenderedComponentWithType(component, dragSource);
          const div = TestUtils.scryRenderedDOMComponentsWithTag(option, 'li')[0];

          expect(div.className).not.toContain('dragging');
          backend.simulateBeginDrag([option.getHandlerId()]);
          expect(div.className).toContain('dragging');
        });
      });
    });

    describe('dropTarget', () => {
      const actions = jasmine.createSpyObj(['reorderProperty', 'addProperty']);
      beforeEach(() => {
        const TestDragAndDropContext = sourceTargetTestContext(dropTarget, dragSource, actions);
        component = renderComponent(TestDragAndDropContext);
        backend = component.getManager().getBackend();
        monitor = component.getManager().getMonitor();
      });

      describe('when reordering', () => {
        it('should call reorder with drag and hover indexes', () => {
          const target = TestUtils.scryRenderedComponentsWithType(component, dropTarget)[0];
          const source = TestUtils.findRenderedComponentWithType(component, dragSource);

          backend.simulateBeginDrag([source.getHandlerId()]);
          backend.simulateHover([target.getHandlerId()]);

          expect(actions.reorderProperty).toHaveBeenCalledWith(2, 1);
        });
      });

      describe('when inserting', () => {
        it('should call addProperty with inserting flag and on index 0', () => {
          const target = TestUtils.scryRenderedComponentsWithType(component, dropTarget)[0];
          const source = TestUtils.findRenderedComponentWithType(component, dragSource);

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
