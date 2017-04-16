import React from 'react';
import {shallow} from 'enzyme';

import {MetadataFormFields} from '../MetadataFormFields';
import {Select, MultiSelect, DatePicker} from 'app/ReactReduxForms';
import {fromJS} from 'immutable';


describe('MetadataFormFields', () => {
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
      template: fromJS({name: 'template1', _id: 'templateId', properties: fieldsTemplate}),
      thesauris: fromJS([{_id: 2, name: 'thesauri', values: [{label: 'option1', id: '1'}]}]),
      model: 'metadata'
    };
  });

  let render = () => {
    component = shallow(<MetadataFormFields {...props}/>);
  };

  it('should pass the field state to every fields and MultipleEditionFieldWarning', () => {
    render();

    let FormGroup = component.findWhere((node) => node.props().model === 'metadata');
    expect(FormGroup.length).toBe(8);

    FormGroup = component.findWhere((node) => node.props().field === 'metadata.field1');
    expect(FormGroup.length).toBe(2);
  });

  it('should render dynamic fields based on the template selected', () => {
    render();
    let inputField = component.findWhere((node) => node.props().model === '.metadata.field1');
    let input = inputField.find('input');
    expect(input).toBeDefined();

    let selectField = component.findWhere((node) => node.props().model === '.metadata.field2');
    let select = selectField.find(Select);
    expect(select.props().options).toEqual(props.thesauris.toJS()[0].values);
    expect(select.props().optionsValue).toEqual('id');

    let multiselect = component.find(MultiSelect);
    expect(multiselect.props().options).toEqual(props.thesauris.toJS()[0].values);
    expect(multiselect.props().optionsValue).toEqual('id');

    let datepicker = component.find(DatePicker);
    expect(datepicker.length).toBe(1);
  });
});
