import React from 'react';
import {shallow} from 'enzyme';

import {FormConfigInput} from 'app/Templates/components/FormConfigInput';
import {FormField} from 'app/Forms';

describe('FormConfigInput', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      type: 'text',
      index: 0,
      model: {properties: [{lable: ''}]},
      formState: {fields: {'properties.0.label': {valid: true, dirty: false, errors: {}}}}
    };
  });

  it('should render FormFields with the correct models', () => {
    component = shallow(<FormConfigInput {...props}/>);
    const formFields = component.find(FormField);
    expect(formFields.nodes[0].props.model).toBe('template.model.properties[0].label');
    expect(formFields.nodes[1].props.model).toBe('template.model.properties[0].required');
    expect(formFields.nodes[2].props.model).toBe('template.model.properties[0].filter');
  });

  describe('validation', () => {
    it('should render the label without errors', () => {
      component = shallow(<FormConfigInput {...props}/>);
      expect(component.find('.has-error').length).toBe(0);
    });
  });

  describe('when the field is invalid and dirty or the form is submited', () => {
    it('should render the label with errors', () => {
      props.formState.fields['properties.0.label'].valid = false;
      props.formState.fields['properties.0.label'].dirty = true;
      component = shallow(<FormConfigInput {...props}/>);
      expect(component.find('.has-error').length).toBe(1);
    });

    it('should render the label with errors', () => {
      props.formState.fields['properties.0.label'].valid = false;
      props.formState.submitFailed = true;
      component = shallow(<FormConfigInput {...props}/>);
      expect(component.find('.has-error').length).toBe(1);
    });
  });
});
