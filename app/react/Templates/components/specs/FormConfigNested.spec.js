import React from 'react';
import {shallow} from 'enzyme';

import {FormConfigNested} from 'app/Templates/components/FormConfigNested';
import {FormField} from 'app/Forms';

describe('FormConfigNested', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      index: 0,
      data: {properties: [{}]},
      formState: {
        fields: {
          'properties.0.label': {valid: true, dirty: false, errors: {}}
        },
        errors: {
          'properties.0.label.required': false,
          'properties.0.label.duplicated': false
        }
      }
    };
  });

  it('should render fields with the correct datas', () => {
    component = shallow(<FormConfigNested {...props}/>);
    const formFields = component.find(FormField);
    expect(formFields.nodes[0].props.model).toBe('template.data.properties[0].label');
    expect(formFields.nodes[1].props.model).toBe('template.data.properties[0].required');
    expect(formFields.nodes[2].props.model).toBe('template.data.properties[0].nestedProperties[0].key');
    expect(formFields.nodes[3].props.model).toBe('template.data.properties[0].nestedProperties[0].label');
    expect(formFields.nodes[4].props.model).toBe('template.data.properties[0].filter');
    expect(formFields.nodes[5].props.model).toBe('template.data.properties[0].showInCard');
  });

  describe('addProperty', () => {
    it('should add a new property', () => {
      component = shallow(<FormConfigNested {...props}/>);
      component.instance().addProperty({preventDefault: () => {}});
      expect(component.state().nestedProperties.length).toBe(2);
    });
  });

  describe('removeProperty', () => {
    it('should remove a property', () => {
      component = shallow(<FormConfigNested {...props}/>);
      component.instance().removeProperty(0, {preventDefault: () => {}});
      expect(component.state().nestedProperties.length).toBe(0);
    });
  });

  describe('validation', () => {
    it('should render the label without errors', () => {
      component = shallow(<FormConfigNested {...props}/>);
      expect(component.find('.has-error').length).toBe(0);
    });
  });

  describe('when the fields are invalid and dirty or the form is submited', () => {
    it('should render the label with errors', () => {
      props.formState.errors['properties.0.label.required'] = true;
      props.formState.fields['properties.0.label'].dirty = true;
      component = shallow(<FormConfigNested {...props}/>);
      expect(component.find('.has-error').length).toBe(1);
    });

    it('should render the label with errors', () => {
      props.formState.errors['properties.0.label.required'] = true;
      props.formState.submitFailed = true;
      component = shallow(<FormConfigNested {...props}/>);
      expect(component.find('.has-error').length).toBe(1);
    });
  });
});
