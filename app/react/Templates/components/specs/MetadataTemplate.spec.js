/**
 * @jest-environment jsdom
 */
import React, { Component } from 'react';
import TestUtils from 'react-dom/test-utils';
import TestBackend from 'react-dnd-test-backend';
import { DragDropContext } from 'react-dnd';
import { Provider } from 'react-redux';
import Immutable from 'immutable';
import { shallow } from 'enzyme';
import { modelReducer, formReducer, Field, Control } from 'react-redux-form';
import { combineReducers, createStore } from 'redux';

import {
  MetadataTemplate,
  dropTarget,
  mapStateToProps,
} from 'app/Templates/components/MetadataTemplate';
import MetadataProperty from 'app/Templates/components/MetadataProperty';
import { dragSource } from 'app/Templates/components/PropertyOption';

function sourceTargetTestContext(Target, Source, actions) {
  return DragDropContext(TestBackend)(
    class TestContextContainer extends Component {
      render() {
        const identity = x => x;
        const properties = [
          { label: 'childTarget', localID: 'childId', inserting: true, type: 'text' },
        ];
        const commonProperties = [];
        const templates = Immutable.fromJS([]);
        const targetProps = {
          properties,
          commonProperties,
          templates,
          connectDropTarget: identity,
          formState: { fields: {}, errors: {} },
          backUrl: 'url',
          saveTemplate: jasmine.createSpy('saveTemplate'),
          defaultColor: '#112233',
        };
        const sourceProps = {
          label: 'source',
          type: 'type',
          index: 2,
          localID: 'source',
          addProperty: () => {},
          connectDragSource: identity,
          formState: { fields: {}, errors: {} },
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

describe('MetadataTemplate', () => {
  function renderComponent(ComponentToRender, props = {}, properties = []) {
    let result;
    const formModel = {
      name: '',
      properties,
      commonProperties: [{ isCommonProperty: true, label: 'Title' }],
    };
    props.properties = properties;
    props.backUrl = 'url';
    const initialData = {
      template: { data: formModel },
      form: { template: {} },
      templates: Immutable.fromJS({ templates: [] }),
      modals: Immutable.fromJS({}),
    };
    const store = createStore(
      combineReducers({
        template: combineReducers({
          data: modelReducer('template.data', formModel),
          formState: formReducer('template.data'),
          uiState: () => Immutable.fromJS({ editProperty: '' }),
        }),
        templates: () => Immutable.fromJS([]),
        form: () => initialData.form,
        modals: () => initialData.modals,
      }),
      initialData
    );
    TestUtils.renderIntoDocument(
      <Provider store={store}>
        <ComponentToRender ref={ref => (result = ref)} {...props} index={1} />
      </Provider>
    );
    return result;
  }

  const props = {
    backUrl: '',
    _id: '123',
    commonProperties: [],
    properties: [],
    connectDropTarget: x => x,
    formState: { fields: {} },
    templates: Immutable.fromJS([]),
    saveTemplate: jasmine.createSpy('saveTemplate'),
    defaultColor: '#112233',
  };

  describe('render()', () => {
    it('should disable send button when saving the template', () => {
      let component = shallow(<MetadataTemplate {...props} />);
      expect(component.find('button').props().disabled).toBe(false);

      props.savingTemplate = true;
      component = shallow(<MetadataTemplate {...props} />);
      expect(component.find('button').props().disabled).toBe(true);
    });

    it('should render the template name field', () => {
      const component = shallow(<MetadataTemplate {...props} />);
      expect(component.find(Field).getElements()[0].props.model).toBe('.name');
    });

    it('should render template color field', () => {
      const component = shallow(<MetadataTemplate {...props} />);
      expect(component.find(Control).first()).toMatchSnapshot();
    });

    describe('when fields is empty', () => {
      it('should render a blank state', () => {
        const component = shallow(<MetadataTemplate {...props} />);
        expect(component.find('.no-properties').length).toBe(1);
      });
    });

    describe('when it has commonProperties', () => {
      it('should render all commonProperties as MetadataProperty', () => {
        props.commonProperties = [
          { label: 'country', type: 'text', _id: '1' },
          { label: 'author', type: 'text', _id: '2' },
        ];
        const component = shallow(<MetadataTemplate {...props} />);
        expect(component.find(MetadataProperty).length).toBe(2);
        expect(
          component
            .find(MetadataProperty)
            .at(0)
            .props().index
        ).toBe(-2);
        expect(
          component
            .find(MetadataProperty)
            .at(1)
            .props().index
        ).toBe(-1);
      });
    });

    describe('when it has properties', () => {
      it('should render all properties as MetadataProperty', () => {
        props.properties = [
          { label: 'country', type: 'text', _id: '1' },
          { label: 'author', type: 'text', _id: '2' },
        ];
        props.commonProperties = [];
        const component = shallow(<MetadataTemplate {...props} />);
        expect(component.find(MetadataProperty).length).toBe(2);
      });
    });
  });

  describe('onSubmit', () => {
    it('should thrim the properties labels and then call props.saveTemplate', () => {
      const component = shallow(<MetadataTemplate {...props} />);
      const template = { properties: [{ label: ' trim me please ' }] };
      component.instance().onSubmit(template);
      expect(props.saveTemplate).toHaveBeenCalledWith({
        properties: [{ label: 'trim me please' }],
      });
    });
  });

  describe('dropTarget', () => {
    const actions = jasmine.createSpyObj('actions', ['inserted', 'addProperty']);
    let backend;
    let component;
    let monitor;

    beforeEach(() => {
      const TestDragAndDropContext = sourceTargetTestContext(dropTarget, dragSource, actions);
      component = renderComponent(TestDragAndDropContext, {}, [{ label: '', type: 'text' }]);
      backend = component.getManager().getBackend();
      monitor = component.getManager().getMonitor();
    });

    describe('when droping', () => {
      it('should addField on the last index', () => {
        const target = TestUtils.findRenderedComponentWithType(component, dropTarget);
        const source = TestUtils.findRenderedComponentWithType(component, dragSource);

        backend.simulateBeginDrag([source.getHandlerId()]);
        backend.simulateHover([target.getHandlerId()]);
        backend.simulateDrop();

        const lastIndex = 1;
        expect(actions.addProperty).toHaveBeenCalledWith(
          { label: 'source', type: 'type' },
          lastIndex
        );
      });
    });

    describe('when droping a property that is being inserted', () => {
      it('should updateProperty removing "inserting" flag on item index', () => {
        const target = TestUtils.findRenderedComponentWithType(component, dropTarget);
        const source = TestUtils.findRenderedComponentWithType(component, dragSource);
        const index = 0;

        backend.simulateBeginDrag([source.getHandlerId()]);
        monitor.getItem().index = index;
        backend.simulateHover([target.getHandlerId()]);
        backend.simulateDrop();

        expect(actions.inserted).toHaveBeenCalledWith(index);
      });
    });
  });

  describe('mapStateToProps', () => {
    it('should select next available template color as defaultColor for new template', () => {
      const template = { data: {}, uiState: Immutable.fromJS({}) };
      const templates = Immutable.fromJS([{ _id: 'id1' }, { _id: 'id2' }, { _id: 'id3' }]);
      const res = mapStateToProps({ template, templates }, {});
      expect(res.defaultColor).toMatchSnapshot();
    });
    it('should select defaultColor based on template index if template already exists', () => {
      const template = { data: { _id: 'id2' }, uiState: Immutable.fromJS({}) };
      const templates = Immutable.fromJS([{ _id: 'id1' }, { _id: 'id2' }, { _id: 'id3' }]);
      const res = mapStateToProps({ template, templates }, {});
      expect(res.defaultColor).toMatchSnapshot();
    });
  });
});
