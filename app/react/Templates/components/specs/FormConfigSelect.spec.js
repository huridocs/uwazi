import React from 'react';
import {shallow} from 'enzyme';
import Immutable from 'immutable';

import {FormConfigSelect} from 'app/Templates/components/FormConfigSelect';
import {Field} from 'react-redux-form';
import {Select} from 'app/ReactReduxForms';

describe('FormConfigSelect', () => {
  let component;
  let thesauris;
  let props;

  beforeEach(() => {
    thesauris = [{_id: 1, name: 'thesauri1'}, {_id: 2, name: 'thesauri2'}, {_id: 3, name: 'Judge', type: 'template'}];
    props = {
      thesauris: Immutable.fromJS(thesauris),
      index: 0,
      data: {properties: []},
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
    component = shallow(<FormConfigSelect {...props}/>);
    const formFields = component.find(Field);
    expect(formFields.getElements()[0].props.model).toBe('template.data.properties[0].label');
    expect(formFields.getElements()[1].props.model).toBe('template.data.properties[0].required');
    expect(formFields.getElements()[2].props.model).toBe('template.data.properties[0].showInCard');
    expect(formFields.getElements()[3].props.model).toBe('template.data.properties[0].filter');

    expect(component.find(Select).props().model).toBe('template.data.properties[0].content');
  });

  it('should render the select with the dictionaries and entities', () => {
    component = shallow(<FormConfigSelect {...props}/>);
    let expectedOptions = [
      {label: 'Thesaurus', options: [thesauris[0], thesauris[1]]},
      {label: 'Entities', options: [thesauris[2]]}
    ];
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
      props.formState['properties.0.label'].touched = true;
      component = shallow(<FormConfigSelect {...props}/>);
      expect(component.find('.has-error').length).toBe(1);
    });

    it('should render the label with errors', () => {
      props.formState.$form.errors['properties.0.label.required'] = true;
      props.formState.submitFailed = true;
      component = shallow(<FormConfigSelect {...props}/>);
      expect(component.find('.has-error').length).toBe(1);
    });
  });
});
