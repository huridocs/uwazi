import React from 'react';
import {shallow} from 'enzyme';
import Immutable from 'immutable';

import {FormConfigSelect} from 'app/Templates/components/FormConfigSelect';
import {Field} from 'react-redux-form';
import {Select} from 'app/ReactReduxForms';

describe('FormConfigSelect', () => {
  let component;
  let thesauris;
  let relationTypes;
  let props;

  beforeEach(() => {
    thesauris = [{_id: 1, name: 'thesauri1'}, {_id: 2, name: 'thesauri2'}, {_id: 3, name: 'Judge', type: 'template'}];
    relationTypes = [{_id: 1, name: 'relationType1'}, {_id: 2, name: 'relationType2'}];
    props = {
      thesauris: Immutable.fromJS(thesauris),
      relationTypes: Immutable.fromJS(relationTypes),
      index: 0,
      data: {properties: []},
      formState: {
        $form: {
          errors: {
            'properties.0.label.required': false,
            'properties.0.label.duplicated': false,
            'properties.0.content.required': false
          }
        }
      }
    };
  });

  it('should render fields with the correct datas', () => {
    component = shallow(<FormConfigSelect {...props}/>);
    const formFields = component.find(Field);
    expect(formFields.nodes[0].props.model).toBe('template.data.properties[0].label');
    expect(formFields.nodes[1].props.model).toBe('template.data.properties[0].required');
    expect(formFields.nodes[2].props.model).toBe('template.data.properties[0].showInCard');
    expect(formFields.nodes[3].props.model).toBe('template.data.properties[0].filter');

    expect(component.find(Select).props().model).toBe('template.data.properties[0].content');
  });

  it('should render the select with the dictionaries', () => {
    component = shallow(<FormConfigSelect {...props}/>);
    let expectedOptions = [thesauris[0], thesauris[1]];
    expect(component.find(Select).props().options).toEqual(expectedOptions);
  });

  describe('validation', () => {
    it('should render the label without errors', () => {
      component = shallow(<FormConfigSelect {...props}/>);
      expect(component.find('.has-error').length).toBe(0);
    });
  });

  describe('when the fields are invalid and dirty or the form is submited', () => {
    it('should render the label with errors', () => {
      props.formState.$form.errors['properties.0.label.required'] = true;
      component = shallow(<FormConfigSelect {...props}/>);
      expect(component.find('.has-error').length).toBe(1);
    });

    it('should render the label with errors', () => {
      props.formState.$form.errors['properties.0.label.required'] = true;
      component = shallow(<FormConfigSelect {...props}/>);
      expect(component.find('.has-error').length).toBe(1);
    });

    it('should render the list select with errors', () => {
      props.formState.$form.errors['properties.0.content.required'] = true;
      props.formState.$form.submitFailed = true;
      component = shallow(<FormConfigSelect {...props}/>);
      expect(component.find('.has-error').length).toBe(1);
    });
  });
});
