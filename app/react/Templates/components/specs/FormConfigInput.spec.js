import React from 'react';
import {shallow} from 'enzyme';

import {FormConfigInput} from 'app/Templates/components/FormConfigInput';
import {Field} from 'react-redux-form';

describe('FormConfigInput', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      type: 'text',
      index: 0,
      data: {properties: [{label: ''}]},
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

  it('should render Fields with the correct datas', () => {
    component = shallow(<FormConfigInput {...props}/>);
    const formFields = component.find(Field);
    expect(formFields.nodes[0].props.model).toBe('template.data.properties[0].label');
    expect(formFields.nodes[1].props.model).toBe('template.data.properties[0].required');
    expect(formFields.nodes[2].props.model).toBe('template.data.properties[0].showInCard');
    expect(formFields.nodes[3].props.model).toBe('template.data.properties[0].filter');
    expect(formFields.nodes[4].props.model).toBe('template.data.properties[0].prioritySorting');
  });

  it('should not allow prioritySorting on types others than text or date', () => {
    props.type = 'text';
    component = shallow(<FormConfigInput {...props}/>);
    expect(component.find(Field).at(4).parent().parent().props().if).toBe(true);
    props.type = 'date';
    component = shallow(<FormConfigInput {...props}/>);
    expect(component.find(Field).at(4).parent().parent().props().if).toBe(true);
    props.type = 'markdown';
    component = shallow(<FormConfigInput {...props}/>);
    expect(component.find(Field).at(4).parent().parent().props().if).toBe(false);
  });

  describe('validation', () => {
    it('should render the label without errors', () => {
      component = shallow(<FormConfigInput {...props}/>);
      expect(component.find('.has-error').length).toBe(0);
    });
  });

  describe('when the field is invalid and dirty or the form is submited', () => {
    it('should render the label with errors', () => {
      props.formState.$form.errors['properties.0.label.required'] = true;
      props.formState['properties.0.label'].dirty = true;
      component = shallow(<FormConfigInput {...props}/>);
      expect(component.find('.has-error').length).toBe(1);
    });

    it('should render the label with errors', () => {
      props.formState.$form.errors['properties.0.label.required'] = true;
      props.formState.submitFailed = true;
      component = shallow(<FormConfigInput {...props}/>);
      expect(component.find('.has-error').length).toBe(1);
    });
  });
});
