import React from 'react';
import { Field } from 'react-redux-form';
import { shallow } from 'enzyme';

import { FormConfigInput } from '../FormConfigInput';
import PropertyConfigOptions from '../PropertyConfigOptions';

describe('FormConfigInput', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      type: 'text',
      index: 0,
      property: { label: '' },
      formState: {
        'properties.0.label': { valid: true, dirty: false, errors: {} },
        $form: {
          errors: {
            'properties.0.label.required': false,
            'properties.0.label.duplicated': false,
          },
        },
      },
    };
  });

  it('should render Fields with the correct datas', () => {
    component = shallow(<FormConfigInput {...props} />);
    const formFields = component.find(Field);
    expect(formFields.getElements()[0].props.model).toBe('template.data.properties[0].label');
    expect(component.find(PropertyConfigOptions).props().canBeFilter).toBe(true);
  });

  describe('validation', () => {
    it('should render the label without errors', () => {
      component = shallow(<FormConfigInput {...props} />);
      expect(component.find('.has-error').length).toBe(0);
    });
  });

  describe('options', () => {
    it('should pass on the canBeFilter option', () => {
      props.canBeFilter = false;
      component = shallow(<FormConfigInput {...props} />);
      expect(component.find(PropertyConfigOptions).props().canBeFilter).toBe(false);
    });
  });

  describe('when the field is invalid and dirty or the form is submited', () => {
    it('should render the label with errors', () => {
      props.formState.$form.errors['properties.0.label.required'] = true;
      props.formState['properties.0.label'].dirty = true;
      component = shallow(<FormConfigInput {...props} />);
      expect(component.find('.has-error').length).toBe(1);
    });

    it('should render the label with errors', () => {
      props.formState.$form.errors['properties.0.label.required'] = true;
      props.formState.submitFailed = true;
      component = shallow(<FormConfigInput {...props} />);
      expect(component.find('.has-error').length).toBe(1);
    });
  });
});
