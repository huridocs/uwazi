/**
 * @jest-environment jsdom
 */
import React, { Component } from 'react';
import { DragDropContext } from 'react-dnd';
import { Provider } from 'react-redux';
import { modelReducer, formReducer, Field, Control } from 'react-redux-form';
import TestUtils from 'react-dom/test-utils';
import { applyMiddleware, combineReducers, createStore } from 'redux';
import Immutable from 'immutable';
import thunk from 'redux-thunk';
import { shallow } from 'enzyme';
import TestBackend from 'react-dnd-test-backend';

import api from 'app/Templates/TemplatesAPI';
import entitiesApi from 'app/Entities/EntitiesAPI';
import pagesApi from 'app/Pages/PagesAPI';

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
      initialData,
      applyMiddleware(thunk)
    );

    TestUtils.renderIntoDocument(
      <Provider store={store}>
        <ComponentToRender ref={ref => (result = ref)} {...props} index={1} />
      </Provider>
    );
    return result;
  }

  let props;
  beforeEach(() => {
    props = {
      backUrl: '',
      _id: '123',
      commonProperties: [],
      properties: [],
      connectDropTarget: x => x,
      formState: { fields: {} },
      templates: Immutable.fromJS([]),
      saveTemplate: jasmine.createSpy('saveTemplate'),
      defaultColor: '#112233',
      entityViewPage: 'aPageSharedId',
      environment: 'template',
    };
    spyOn(pagesApi, 'get').and.returnValue(Promise.resolve({}));
  });

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

    it('should render a field with the entityViewPage model', () => {
      const component = shallow(<MetadataTemplate {...props} />);
      const field = component.findWhere(n => n.props().model === '.entityViewPage');
      expect(field).toHaveLength(1);
    });

    it('should render a component with that receives the entityViewPage prop', () => {
      const component = shallow(<MetadataTemplate {...props} />);
      const formComponent = component.findWhere(n => n.props().selectedPage === 'aPageSharedId');
      expect(formComponent).toHaveLength(1);
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

    describe('enviroment prop', () => {
      it('should render the template editor when environment is template', () => {
        props.properties = [
          { label: 'country', type: 'text', _id: '1' },
          { label: 'author', type: 'text', _id: '2' },
        ];
        const component = shallow(<MetadataTemplate {...props} />);
        expect(component.find(MetadataProperty).length).toBe(2);
      });
      it('should not render the template editor when environment is relationType', () => {
        props.environment = 'relationType';
        props.properties = [
          { label: 'country', type: 'text', _id: '1' },
          { label: 'author', type: 'text', _id: '2' },
        ];
        const component = shallow(<MetadataTemplate {...props} />);
        expect(component.find(MetadataProperty).length).toBe(0);
      });
    });
  });

  describe('onSubmit', () => {
    it('should trim the properties labels and then call props.saveTemplate', async () => {
      spyOn(api, 'validateMapping').and.returnValue({ errors: [], valid: true });
      spyOn(entitiesApi, 'countByTemplate').and.returnValue(100);
      const component = shallow(<MetadataTemplate {...props} />);
      const template = { properties: [{ label: ' trim me please ' }] };
      await component.instance().onSubmit(template);
      expect(props.saveTemplate).toHaveBeenCalledWith({
        properties: [{ label: 'trim me please' }],
      });
    });

    describe('confirmation of saving', () => {
      let context;
      const template = { properties: [{ name: 'dob', type: 'date', label: 'Date of birth' }] };

      async function submitTemplate(validMapping = true, entityCount = 100) {
        context = {
          confirm: jasmine.createSpy('confirm'),
        };
        spyOn(api, 'validateMapping').and.returnValue({
          error: 'error',
          valid: validMapping,
        });
        spyOn(entitiesApi, 'countByTemplate').and.returnValue(entityCount);
        const component = shallow(<MetadataTemplate {...props} />, { context });
        await component.instance().onSubmit(template);
      }

      describe('when the mapping has conflicts', () => {
        it('should ask for a reindex', async () => {
          await submitTemplate(false);
          context.confirm.calls.mostRecent().args[0].accept();
          expect(props.saveTemplate).toHaveBeenCalledWith({
            properties: [{ name: 'dob', type: 'date', label: 'Date of birth' }],
            reindex: true,
          });
        });

        describe('when there is a quite amount of entities from the template', () => {
          it('should ask for a reindex', async () => {
            await submitTemplate(true, 50000);
            context.confirm.calls.mostRecent().args[0].cancel();
            expect(props.saveTemplate).not.toHaveBeenCalled();
          });
        });
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
