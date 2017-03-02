import React from 'react';
import {shallow} from 'enzyme';
import Immutable from 'immutable';

import {MetadataForm} from '../MetadataForm';
import {Form, Field} from 'react-redux-form';
import {Select as SimpleSelect} from 'app/Forms';
import {Select, IconSelector, MultiSelect, DatePicker} from 'app/ReactReduxForms';


describe('MetadataForm', () => {
  let component;
  let fieldsTemplate;
  let props;

  beforeEach(() => {
    fieldsTemplate = [
      {name: 'field1', label: 'label1'},
      {name: 'field2', label: 'label2', type: 'select', content: '2'},
      {name: 'field3', label: 'label3', type: 'multiselect', content: '2'},
      {name: 'field4', label: 'label4', type: 'date'}
    ];

    props = {
      metadata: {_id: 'docId', template: 'templateId', title: 'testTitle', metadata: {field1: 'field1value', field2: 'field2value'}},
      templates: Immutable.fromJS([
        {name: 'template1', _id: 'templateId', properties: fieldsTemplate},
        {name: 'template2', _id: '2', properties: [{name: 'field3'}]},
        {name: 'template3', _id: '3', properties: [{name: 'field4'}], isEntity: true}
      ]),
      thesauris: Immutable.fromJS([{_id: 2, name: 'thesauri', values: [{label: 'option1', id: '1'}]}]),
      onSubmit: jasmine.createSpy('onSubmit'),
      changeTemplate: jasmine.createSpy('changeTemplate'),
      state: {title: {titleProp: 'prop'}, metadata: {field1: {field1Prop: 'prop'}}},
      model: 'metadata'
    };
  });

  let render = () => {
    component = shallow(<MetadataForm {...props}/>);
  };

  it('should render a form with metadata as model', () => {
    render();
    let form = component.find(Form);
    expect(form.props().model).toEqual('metadata');
  });

  it('should pass the field state to every fields', () => {
    render();
    let FormGroup = component.findWhere((node) => node.props().titleProp === 'prop');
    expect(FormGroup.length).toBe(1);
  });

  it('should render title field as a textarea', () => {
    render();
    let title = component.find('textarea').closest(Field);
    expect(title.props().model).toEqual('.title');
  });

  it('should render template as a select, only with document templates', () => {
    render();
    let templateSelector = component.find(SimpleSelect).first();
    expect(templateSelector.props().options).toEqual([{label: 'template1', value: 'templateId'}, {label: 'template2', value: '2'}]);
  });

  it('should render an icon selector linked to the icon property', () => {
    render();
    let iconSelector = component.find(IconSelector);
    expect(iconSelector.props().model).toBe('.icon');
  });

  describe('on template change', () => {
    it('should call changeTemplate with the document and the template', () => {
      render();
      let template = component.find(SimpleSelect).first();
      template.simulate('change', {target: {value: '2'}});
      expect(props.changeTemplate).toHaveBeenCalledWith(props.model, props.metadata, props.templates.toJS()[1]);
    });
  });

  describe('submit', () => {
    it('should call onSubmit with the values', () => {
      render();
      component.find(Form).simulate('submit', 'values');
      expect(props.onSubmit).toHaveBeenCalledWith('values');
    });
  });
});
