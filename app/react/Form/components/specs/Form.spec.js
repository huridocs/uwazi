import React from 'react';
import {shallow} from 'enzyme';

import {Form} from 'app/Form/components/Form';
import Input from 'app/Form/components/Input';
import Select from 'app/Form/components/Select';
import Textarea from 'app/Form/components/Textarea';

describe('Form', () => {
  let component;
  let reduxFormFields;
  let fieldsConfig;

  beforeEach(() => {
    reduxFormFields = {field1: {someProp: 'prop1'}, field2: {someProp: 'prop2'}};
    fieldsConfig = [{name: 'field1', label: 'label1'}, {name: 'field2', label: 'label2'}];
  });

  let render = () => {
    component = shallow(<Form fields={reduxFormFields} fieldsConfig={fieldsConfig}/>);
  };

  it('should render 2 input fields passing reduxFormField as props', () => {
    render();
    let inputs = component.find(Input);

    expect(inputs.length).toBe(2);
    expect(inputs.first().props()).toEqual({properties: {someProp: 'prop1'}, label: 'label1'});
    expect(inputs.last().props()).toEqual({properties: {someProp: 'prop2'}, label: 'label2'});
  });

  describe('type select', () => {
    it('should render a select', () => {
      reduxFormFields = {field1: {selectProp: 'prop'}};
      fieldsConfig = [{name: 'field1', label: 'label', type: 'select', options: [{label: 'Option', value: 'option'}]}];
      render();

      expect(component.find(Select).props().label).toEqual('label');
      expect(component.find(Select).props().properties).toEqual({selectProp: 'prop'});
      expect(component.find(Select).props().options).toEqual(fieldsConfig[0].options);
    });
  });

  describe('type textarea', () => {
    it('should render a select', () => {
      reduxFormFields = {field1: {textareaProp: 'prop'}};
      fieldsConfig = [{name: 'field1', label: 'label', type: 'textarea'}];
      render();

      expect(component.find(Textarea).props().label).toEqual('label');
      expect(component.find(Textarea).props().properties).toEqual({textareaProp: 'prop'});
      expect(component.find(Textarea).props().options).toEqual(fieldsConfig[0].options);
    });
  });
});
