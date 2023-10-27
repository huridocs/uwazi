/**
 * @jest-environment jsdom
 */
/* eslint-disable max-classes-per-file */
/* eslint-disable react/no-multi-comp */
/* eslint-disable max-lines */

import React, { Component } from 'react';
import TestUtils from 'react-dom/test-utils';
import { TestBackend } from 'react-dnd-test-backend';
import { DragDropContext } from 'react-dnd-old';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import Immutable from 'immutable';
import { shallow } from 'enzyme';
import configureStore from 'redux-mock-store';
import Connected, { MetadataProperty, dragSource, dropTarget } from '../MetadataProperty';
import FormConfigMultimedia from '../FormConfigMultimedia';
import FormConfigInput from '../FormConfigInput';
import { FormConfigSelect } from '../FormConfigSelect';
import FormConfigNested from '../FormConfigNested';
import FormConfigRelationship from '../FormConfigRelationship';

const mockStoreCreator = configureStore([]);

function wrapInTestContext(DecoratedComponent) {
  return DragDropContext(TestBackend)(
    class TestContextContainer extends Component {
      render() {
        return <DecoratedComponent {...this.props} errors={{}} />;
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
          formState: { fields: [], $form: { errors: {} } },
          template: {
            commonProperties: [{ name: 'title', label: 'Title' }],
          },
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
          formState: { fields: [], $form: { errors: {} } },
          template: {
            commonProperties: [{ name: 'title', label: 'Title' }],
          },
        };
        return (
          <div>
            <Target {...targetProps} {...actions} />
            <Source {...sourceProps} />
          </div>
        );
      }
    }
  );
}

describe('MetadataProperty', () => {
  let component;

  const render = (_store, props) => {
    const DNDComponent = DragDropContext(TestBackend)(Connected);
    const store = {
      ..._store,
      translations: () => Immutable.fromJS([]),
      inlineEdit: () => Immutable.fromJS({}),
    };
    return shallow(
      <Provider store={store}>
        <DNDComponent {...props} />
      </Provider>
    )
      .dive({ context: { store } })
      .dive()
      .dive()
      .dive()
      .dive();
  };

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
        editProperty,
        uiState: Immutable.fromJS({ editingProperty: '' }),
        templates: Immutable.fromJS([]),
        translations: () => Immutable.fromJS([]),
        inlineEdit: () => Immutable.fromJS({}),
      };
    });

    describe('title field error', () => {
      it('should render duplicated error on title field', () => {
        props.index = -2;
        props.label = 'Title';

        const store = mockStoreCreator({
          template: {
            uiState: Immutable.fromJS({}),
            formState: {
              fields: [],
              $form: {
                errors: {
                  'commonProperties.0.label.duplicated': true,
                },
              },
            },
            data: {
              commonProperties: [{ name: 'title', label: 'Title' }, { name: 'creationDate' }],
            },
          },
        });

        const connectedComponent = render(store, props);
        expect(connectedComponent.find('.validation-error').length).toBe(1);
      });
    });

    describe('ui actions', () => {
      describe('delete button', () => {
        it('should not be there', () => {
          component = shallow(<MetadataProperty {...props} />);
          expect(component.find('.property-remove').length).toBe(0);
        });
      });

      describe('edit button', () => {
        it('should editProperty', () => {
          component = shallow(<MetadataProperty {...props} />);
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
          commonProperties: [{ name: 'title', label: 'Title' }, { name: 'creationDate' }],
        },
        removeProperty,
        editProperty,
        uiState: Immutable.fromJS({ editingProperty: '' }),
        templates: Immutable.fromJS([]),
      };

      component = shallow(<MetadataProperty {...props} />);
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

    describe('when type is custom type', () => {
      const checkMultimedia = (canSetStyle, canBeRequired) => {
        expect(component.find(FormConfigMultimedia).length).toBe(1);
        expect(component.find(FormConfigMultimedia).props().canSetStyle).toBe(canSetStyle);
        expect(component.find(FormConfigMultimedia).props().canBeRequired).toBe(canBeRequired);
      };

      it('should render the correct component', () => {
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

        component.setProps({ type: 'image' });
        checkMultimedia(true, true);

        component.setProps({ type: 'preview' });
        checkMultimedia(true, false);

        component.setProps({ type: 'media' });
        checkMultimedia(false, true);

        component.setProps({ type: 'geolocation' });
        expect(component.find(FormConfigInput).length).toBe(1);
        expect(component.find(FormConfigInput).props().canBeFilter).toBe(false);
      });

      describe('errors', () => {
        it('should render duplicated relation error', () => {
          props.formState.$form.errors['properties.1.relationType.duplicated'] = true;
          const store = mockStoreCreator({
            template: {
              uiState: Immutable.fromJS({}),
              formState: {
                fields: [],
                $form: {
                  errors: {
                    'properties.1.relationType.duplicated': true,
                  },
                },
              },
              data: {
                commonProperties: [],
              },
            },
          });

          const connectedComponent = render(store, props);
          expect(connectedComponent.find('.validation-error')).toMatchSnapshot();
        });

        it('should render duplicated label error', () => {
          const store = mockStoreCreator({
            template: {
              uiState: Immutable.fromJS({}),
              formState: {
                fields: [],
                $form: {
                  errors: {
                    'properties.1.label.duplicated': true,
                  },
                },
              },
              data: {
                commonProperties: [],
              },
            },
          });

          const connectedComponent = render(store, props);
          expect(connectedComponent.find('.validation-error')).toMatchSnapshot();
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
        properties: [
          { label: '', type: 'text' },
          { label: '', type: 'text' },
          { label: '', type: 'text' },
        ],
      };
      store = createStore(() => ({
        template: {
          data: templateData,
          uiState: Immutable.fromJS({ templates: [] }),
          formState: { fields: [], errors: {} },
        },
        translations: Immutable.fromJS([]),
        inlineEdit: Immutable.fromJS({}),
        templates: Immutable.fromJS([]),
        modals: Immutable.fromJS({}),
      }));
      TestUtils.renderIntoDocument(
        <Provider store={store}>
          <ComponentToRender ref={ref => (result = ref)} {...props} index={0} />
        </Provider>
      );
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
          formState: { fields: [], $form: { errors: {} } },
          template: {
            commonProperties: [{ name: 'title', label: 'Title' }],
          },
        });
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
          const div = TestUtils.scryRenderedDOMComponentsWithTag(option, 'div')[0];

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
          expect(actions.addProperty).toHaveBeenCalledWith(
            { label: 'source', type: 'type', inserting: true },
            0
          );
        });
      });
    });
  });
});
