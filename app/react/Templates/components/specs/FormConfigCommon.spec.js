import React from 'react';
import {shallow} from 'enzyme';

import {FormConfigCommon} from 'app/Templates/components/FormConfigCommon';
import {Field} from 'react-redux-form';

describe('FormConfigCommon', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      type: 'text',
      index: -1,
      data: {commonProperties: [{label: ''}, {label: ''}]},
      formState: {
        'commonProperties.0.label': {valid: true, dirty: false, errors: {}},
        $form: {
          errors: {
            'properties.0.label.required': false,
            'properties.0.label.duplicated': false
          }
        }
      }
    };
  });

  it('should render Fields with the correct datas and corrected index', () => {
    component = shallow(<FormConfigCommon {...props}/>);
    const formFields = component.find(Field);
    expect(formFields.nodes[0].props.model).toBe('template.data.commonProperties[1].prioritySorting');
  });

  describe('validation', () => {
    it('should render the label without errors', () => {
      component = shallow(<FormConfigCommon {...props}/>);
      expect(component.find('.has-error').length).toBe(0);
    });
  });
});
