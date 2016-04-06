import React from 'react';
import {shallow} from 'enzyme';

import {Form} from 'app/Form/components/Form';

fdescribe('Form', () => {
  let component;
  let reduxFormFields;
  let fieldsConfig;

  beforeEach(() => {
    reduxFormFields = {field1: {someProp: 'prop1'}, field2: {someProp: 'prop2'}};
    fieldsConfig = [{name: 'field1'}, {name: 'field2'}];
  });

  let render = () => {
    component = shallow(<Form fields={reduxFormFields} fieldsConfig={fieldsConfig}/>);
  };

  it('should render 2 input fields passing reduxFormField as props', () => {
    render();
    let inputs = component.find('input');

    expect(inputs.length).toBe(2);
    expect(inputs.first().props()).toEqual({someProp: 'prop1'});
    expect(inputs.last().props()).toEqual({someProp: 'prop2'});
  });

  describe('type select', () => {
    it('should render a select', () => {
      reduxFormFields = {field1: {selectProp: 'prop'}};
      fieldsConfig = [{name: 'field1', type: 'select'}];
      render();

      expect(component.find('select').props()).toEqual({selectProp: 'prop'});
    });
  });
});
