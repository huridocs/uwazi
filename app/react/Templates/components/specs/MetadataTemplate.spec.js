import React, {Component} from 'react';
import TestUtils from 'react-dom/test-utils';
import TestBackend from 'react-dnd-test-backend';
import {DragDropContext} from 'react-dnd';
import {Provider} from 'react-redux';
import {createStore} from 'redux';
import Immutable from 'immutable';
import {shallow} from 'enzyme';
import {modelReducer, formReducer, Field} from 'react-redux-form';
import {combineReducers} from 'redux';

import {MetadataTemplate, dropTarget} from 'app/Templates/components/MetadataTemplate';
import MetadataProperty from 'app/Templates/components/MetadataProperty';
import {dragSource} from 'app/Templates/components/PropertyOption';

function sourceTargetTestContext(Target, Source, actions) {
  return DragDropContext(TestBackend)(
    class TestContextContainer extends Component {
      render() {
        const identity = x => x;
        let properties = [{label: 'childTarget', localID: 'childId', inserting: true, type: 'text'}];
        let commonProperties = [];
        let templates = Immutable.fromJS([]);
        let targetProps = {properties, commonProperties, templates, connectDropTarget: identity, formState: {fields: {}, errors: {}}, backUrl: 'url'};
        let sourceProps = {label: 'source', type: 'type', index: 2, localID: 'source', connectDragSource: identity,
          formState: {fields: {}, errors: {}}};
        return <div>
                <Target {...targetProps} {...actions}/>
                <Source {...sourceProps} />
              </div>;
      }
    }
  );
}

describe('MetadataTemplate', () => {
  function renderComponent(ComponentToRender, props = {}, properties = []) {
    let result;
    let formModel = {name: '', properties: properties, commonProperties: [{isCommonProperty: true, label: 'Title'}]};
    props.properties = properties;
    props.backUrl = 'url';
    let initialData = {
      template: {data: formModel},
      form: {template: {}},
      templates: Immutable.fromJS({templates: []}),
      modals: Immutable.fromJS({})
    };
    let store = createStore(
      combineReducers({template:
        combineReducers({
          data: modelReducer('template.data', formModel),
          formState: formReducer('template.data'),
          uiState: () => {
            return Immutable.fromJS({editProperty: ''});
          }
        }),
        templates: () => Immutable.fromJS([]),
        form: () => initialData.form,
        modals: () => initialData.modals
      }),
      initialData
    );
    TestUtils.renderIntoDocument(<Provider store={store}><ComponentToRender ref={(ref) => result = ref} {...props} index={1}/></Provider>);
    return result;
  }

  describe('render()', () => {
    let props = {
      backUrl: '',
      _id: '123',
      commonProperties: [],
      properties: [],
      connectDropTarget: (x) => x,
      formState: {fields: {}},
      templates: Immutable.fromJS([])
    };

    it('should disable send button when saving the template', () => {
      let component = shallow(<MetadataTemplate {...props} />);
      expect(component.find('button').props().disabled).toBe(false);

      props.savingTemplate = true;
      component = shallow(<MetadataTemplate {...props} />);
      expect(component.find('button').props().disabled).toBe(true);
    });

    it('should render the template name field', () => {
      let component = shallow(<MetadataTemplate {...props} />);
      expect(component.find(Field).getElements()[0].props.model).toBe('.name');
    });

    describe('when fields is empty', () => {
      it('should render a blank state', () => {
        let component = shallow(<MetadataTemplate {...props} />);
        expect(component.find('.no-properties').length).toBe(1);
      });
    });

    describe('when it has commonProperties', () => {
      it('should render all commonProperties as MetadataProperty', () => {
        props.commonProperties = [{label: 'country', type: 'text', _id: '1'}, {label: 'author', type: 'text', _id: '2'}];
        let component = shallow(<MetadataTemplate {...props} />);
        expect(component.find(MetadataProperty).length).toBe(2);
        expect(component.find(MetadataProperty).at(0).props().index).toBe(-2);
        expect(component.find(MetadataProperty).at(1).props().index).toBe(-1);
      });
    });

    describe('when it has properties', () => {
      it('should render all properties as MetadataProperty', () => {
        props.properties = [{label: 'country', type: 'text', _id: '1'}, {label: 'author', type: 'text', _id: '2'}];
        props.commonProperties = [];
        let component = shallow(<MetadataTemplate {...props} />);
        expect(component.find(MetadataProperty).length).toBe(2);
      });
    });
  });

  describe('dropTarget', () => {
    let actions = jasmine.createSpyObj('actions', ['inserted', 'addProperty']);
    let backend;
    let component;
    let monitor;

    beforeEach(() => {
      let TestDragAndDropContext = sourceTargetTestContext(dropTarget, dragSource, actions);
      component = renderComponent(TestDragAndDropContext, {}, [{label: '', type: 'text'}]);
      backend = component.getManager().getBackend();
      monitor = component.getManager().getMonitor();
    });

    describe('when droping', () => {
      it('should addField on the last index', () => {
        let target = TestUtils.findRenderedComponentWithType(component, dropTarget);
        let source = TestUtils.findRenderedComponentWithType(component, dragSource);

        backend.simulateBeginDrag([source.getHandlerId()]);
        backend.simulateHover([target.getHandlerId()]);
        backend.simulateDrop();

        let lastIndex = 1;
        expect(actions.addProperty).toHaveBeenCalledWith({label: 'source', type: 'type'}, lastIndex);
      });
    });

    describe('when droping a property that is being inserted', () => {
      it('should updateProperty removing "inserting" flag on item index', () => {
        let target = TestUtils.findRenderedComponentWithType(component, dropTarget);
        let source = TestUtils.findRenderedComponentWithType(component, dragSource);
        let index = 0;

        backend.simulateBeginDrag([source.getHandlerId()]);
        monitor.getItem().index = index;
        backend.simulateHover([target.getHandlerId()]);
        backend.simulateDrop();

        expect(actions.inserted).toHaveBeenCalledWith(index);
      });
    });
  });
});
