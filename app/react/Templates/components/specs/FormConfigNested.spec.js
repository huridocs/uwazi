import React from 'react';
import {shallow} from 'enzyme';

import {FormConfigNested} from 'app/Templates/components/FormConfigNested';
import {Field} from 'react-redux-form';

describe('FormConfigNested', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      index: 0,
      data: {properties: [{nestedProperties: [
        {key: 'nestedPropOne', label: 'nested prop one'},
        {key: 'nestedPropTwo', label: 'nested prop two'}
      ]}]},
      setNestedProperties: jasmine.createSpy('setNestedProperties'),
      formState: {
        'properties.0.label': {valid: true, dirty: false, errors: {}},
        $form: {
          errors: {
            'properties.0.label.required': false,
            'properties.0.label.duplicated': false
          }
        }
      }
    };
  });

  it('should render fields with the correct datas', () => {
    component = shallow(<FormConfigNested {...props}/>);
    const formFields = component.find(Field);
    expect(formFields.getElements()[0].props.model).toBe('template.data.properties[0].label');
    expect(formFields.getElements()[1].props.model).toBe('template.data.properties[0].required');
    expect(formFields.getElements()[2].props.model).toBe('template.data.properties[0].showInCard');
    expect(formFields.getElements()[3].props.model).toBe('template.data.properties[0].filter');
  });

  describe('validation', () => {
    it('should render the label without errors', () => {
      component = shallow(<FormConfigNested {...props}/>);
      expect(component.find('.has-error').length).toBe(0);
    });
  });

  describe('when the fields are invalid and dirty or the form is submited', () => {
    it('should render the label with errors', () => {
      props.formState.$form.errors['properties.0.label.required'] = true;
      props.formState['properties.0.label'].dirty = true;
      component = shallow(<FormConfigNested {...props}/>);
      expect(component.find('.has-error').length).toBe(1);
    });

    it('should render the label with errors', () => {
      props.formState.$form.errors['properties.0.label.required'] = true;
      props.formState.submitFailed = true;
      component = shallow(<FormConfigNested {...props}/>);
      expect(component.find('.has-error').length).toBe(1);
    });
  });
});
