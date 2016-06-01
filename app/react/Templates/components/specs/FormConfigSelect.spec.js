import React from 'react';
import {shallow} from 'enzyme';
import Immutable from 'immutable';

import {FormConfigSelect} from 'app/Templates/components/FormConfigSelect';
import {FormField, Select, SelectField} from 'app/Forms';

describe('FormConfigSelect', () => {
  let component;
  let thesauris;
  let props;

  beforeEach(() => {
    thesauris = [{_id: 1, name: 'thesauri1'}, {_id: 2, name: 'thesauri2'}];
    props = {
      ui: Immutable.fromJS({thesauris}),
      index: 0,
      data: {properties: []},
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
    component = shallow(<FormConfigSelect {...props}/>);
    const formFields = component.find(FormField);
    expect(formFields.nodes[0].props.model).toBe('template.data.properties[0].label');
    expect(formFields.nodes[1].props.model).toBe('template.data.properties[0].required');
    expect(formFields.nodes[2].props.model).toBe('template.data.properties[0].filter');

    expect(component.find(SelectField).node.props.model).toBe('template.data.properties[0].content');
  });

  it('should render the select with the thesauris', () => {
    component = shallow(<FormConfigSelect {...props}/>);
    expect(component.find(Select).node.props.options).toEqual(thesauris);
  });

  describe('validation', () => {
    it('should render the label without errors', () => {
      component = shallow(<FormConfigSelect {...props}/>);
      expect(component.find('.has-error').length).toBe(0);
    });
  });

  describe('when the fields are invalid and dirty or the form is submited', () => {
    it('should render the label with errors', () => {
      props.formState.errors['properties.0.label.required'] = true;
      props.formState.fields['properties.0.label'].dirty = true;
      component = shallow(<FormConfigSelect {...props}/>);
      expect(component.find('.has-error').length).toBe(1);
    });

    it('should render the label with errors', () => {
      props.formState.errors['properties.0.label.required'] = true;
      props.formState.submitFailed = true;
      component = shallow(<FormConfigSelect {...props}/>);
      expect(component.find('.has-error').length).toBe(1);
    });
  });
});
