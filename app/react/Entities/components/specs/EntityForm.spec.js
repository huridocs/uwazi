import React from 'react';
import {shallow} from 'enzyme';
import Immutable from 'immutable';

import {EntityForm} from '../EntityForm';
import {Form} from 'react-redux-form';
import {FormField, Select} from 'app/Forms';

describe('EntityForm', () => {
  let component;
  let fieldsTemplate;
  let props;

  beforeEach(() => {
    fieldsTemplate = [{name: 'field1', label: 'label1'}, {name: 'field2', label: 'label2', type: 'select', content: '2'}];

    props = {
      entity: {_id: 'docId', template: '3', title: 'testTitle', metadata: {field1: 'field1value', field2: 'field2value'}},
      templates: Immutable.fromJS([
        {name: 'template1', _id: '1', properties: [{name: 'field2'}]},
        {name: 'template2', _id: '2', properties: [{name: 'field3'}], isEntity: true},
        {name: 'template3', _id: '3', properties: fieldsTemplate, isEntity: true}
      ]),
      thesauris: Immutable.fromJS([{_id: 2, name: 'thesauri', values: [{label: 'option1', id: '1'}]}]),
      onSubmit: jasmine.createSpy('onSubmit'),
      changeTemplate: jasmine.createSpy('changeTemplate'),
      state: {fields: {title: {titleProp: 'prop'}, 'metadata.field1': {field1Prop: 'prop'}}},
      model: 'entity'
    };
  });

  let render = () => {
    component = shallow(<EntityForm {...props}/>);
  };

  it('should render a form with entity as model', () => {
    render();
    let form = component.find(Form);
    expect(form.props().model).toEqual('entity');
  });

  it('should render title field as a textarea', () => {
    render();
    let title = component.find('textarea').closest(FormField);
    expect(title.props().model).toEqual('entity.title');
  });

  it('should render template as a select, only with entities templates', () => {
    render();
    let template = component.find(Select).first();
    expect(template.props().options).toEqual([{label: 'template2', value: '2'}, {label: 'template3', value: '3'}]);
  });

  describe('on template change', () => {
    it('should call changeTemplate with the entity and the template', () => {
      render();
      let template = component.find(Select).first();
      template.simulate('change', {target: {value: '2'}});
      expect(props.changeTemplate).toHaveBeenCalledWith(props.model, props.entity, props.templates.toJS()[1]);
    });
  });

  it('should pass the field state to every fields', () => {
    render();
    let FormGroup = component.findWhere((node) => node.props().titleProp === 'prop');
    expect(FormGroup.length).toBe(1);

    FormGroup = component.findWhere((node) => node.props().field1Prop === 'prop');
    expect(FormGroup.length).toBe(1);
  });

  it('should render dynamic fields based on the template selected', () => {
    render();
    let inputField = component.findWhere((node) => node.props().model === 'entity.metadata.field1');
    let input = inputField.find('input');
    expect(input).toBeDefined();

    let selectField = component.findWhere((node) => node.props().model === 'entity.metadata.field2');
    let select = selectField.find(Select);
    expect(select.props().options).toEqual(props.thesauris.toJS()[0].values);
    expect(select.props().optionsValue).toEqual('id');
  });

  describe('submit', () => {
    it('should call onSubmit with the values', () => {
      render();
      component.find(Form).simulate('submit', 'values');
      expect(props.onSubmit).toHaveBeenCalledWith('values');
    });
  });
});
