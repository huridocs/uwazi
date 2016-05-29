import React, {Component} from 'react';
import TestUtils from 'react-addons-test-utils';
import TestBackend from 'react-dnd-test-backend';
import {DragDropContext} from 'react-dnd';
import {Provider} from 'react-redux';
import {createStore} from 'redux';
import Immutable from 'immutable';
import {shallow} from 'enzyme';
import {Form, actions as formActions} from 'react-redux-form';

import {MetadataTemplate, dropTarget} from 'app/Templates/components/MetadataTemplate';
import {FormField} from 'app/Forms';
import MetadataProperty from 'app/Templates/components/MetadataProperty';
import {dragSource} from 'app/Templates/components/PropertyOption';

function sourceTargetTestContext(Target, Source, actions) {
  return DragDropContext(TestBackend)(
    class TestContextContainer extends Component {
      render() {
        const identity = x => x;
        let properties = [{label: 'childTarget', localID: 'childId', inserting: true}];
        let targetProps = {properties: properties, connectDropTarget: identity, formState: {fields: {}}};
        let sourceProps = {label: 'source', type: 'type', index: 2, localID: 'source', connectDragSource: identity, formState: {fields: {}}};
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
    let formModel = {name: '', properties: properties};
    props.properties = properties;
    let store = createStore(() => {
      return {
        template: {model: formModel, formState: {fields: {name: {}, properties: []}}, uiState: Immutable.fromJS({templates: []})},
        form: {template: {}},
        modals: Immutable.fromJS({})
      };
    });
    TestUtils.renderIntoDocument(<Provider store={store}><ComponentToRender ref={(ref) => result = ref} {...props} index={1}/></Provider>);
    return result;
  }

  describe('render()', () => {
    it('should render the template name field', () => {
      let props = {properties: [], connectDropTarget: (x) => x, formState: {fields: {}}};
      let component = shallow(<MetadataTemplate {...props} />);
      expect(component.find(FormField).node.props.model).toBe('template.model.name');
    });

    describe('when fields is empty', () => {
      it('should render a blank state', () => {
        let props = {properties: [], connectDropTarget: (x) => x, formState: {fields: {}}};
        let component = shallow(<MetadataTemplate {...props} />);
        expect(component.find('.no-properties').length).toBe(1);
      });
    });

    describe('when has fields', () => {
      it('should render all fields as MetadataProperty', () => {
        let props = {properties: [{label: 'country'}, {label: 'author'}], connectDropTarget: (x) => x, formState: {fields: {}}};
        let component = shallow(<MetadataTemplate {...props} />);
        expect(component.find(MetadataProperty).length).toBe(2);
      });
    });

    describe('onSubmit', () => {
      describe('when the form is valid', () => {
        it('should call saveTemplate', () => {
          let saveTemplate = jasmine.createSpy('saveTemplate');
          let props = {
            properties: [{label: 'country'}, {label: 'author'}],
            connectDropTarget: (x) => x,
            formState: {fields: {}, valid: true},
            saveTemplate
          };
          let component = shallow(<MetadataTemplate {...props} />);
          component.find(Form).simulate('submit');
          expect(saveTemplate).toHaveBeenCalled();
        });
      });

      describe('when the form is invalid', () => {
        it('should call saveTemplate', () => {
          let saveTemplate = jasmine.createSpy('saveTemplate');
          let setSubmitFailed = jasmine.createSpy('setSubmitFailed');
          let props = {
            properties: [{label: 'country'}, {label: 'author'}],
            connectDropTarget: (x) => x,
            formState: {fields: {}, valid: false},
            saveTemplate,
            setSubmitFailed
          };
          let component = shallow(<MetadataTemplate {...props} />);
          spyOn(formActions, 'setSubmitFailed');
          component.find(Form).simulate('submit');
          expect(saveTemplate).not.toHaveBeenCalled();
          expect(setSubmitFailed).toHaveBeenCalledWith('template.model');
        });
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
      component = renderComponent(TestDragAndDropContext, {}, [{label: ''}]);
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
