import React from 'react';
import { shallow } from 'enzyme';

import { FormConfigCommon } from 'app/Templates/components/FormConfigCommon';
import { Field } from 'react-redux-form';
import PropertyConfigOption from 'app/Templates/components/PropertyConfigOption';

describe('FormConfigCommon', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      type: 'text',
      index: -1,
      data: {
        commonProperties: [
          { label: '', name: 'title' },
          { label: '', name: 'creationDate' },
        ],
      },
      formState: {
        'commonProperties.0.label': { valid: true, dirty: false, errors: {} },
        $form: {
          errors: {
            'commonProperties.0.label.required': false,
            'commonProperties.0.label.duplicated': false,
          },
        },
      },
    };
  });

  const render = () => {
    component = shallow(<FormConfigCommon {...props} />);
    return component;
  };

  it('should render Fields with the correct datas and corrected index', () => {
    component = shallow(<FormConfigCommon {...props} />);
    const formFields = component.find(Field);
    expect(formFields.getElements()[0].props.model).toBe(
      'template.data.commonProperties[1].prioritySorting'
    );
  });
  it('should render name field if property name is title', () => {
    props.index = -2;
    component = shallow(<FormConfigCommon {...props} />);
    const formFields = component.find(Field);
    expect(formFields.getElements()[0].props.model).toBe('template.data.commonProperties[0].label');
    expect(formFields.getElements()[1].props.model).toBe(
      'template.data.commonProperties[0].prioritySorting'
    );
  });
  it('should render generatedId option for title property', () => {
    props.index = -2;
    component = shallow(<FormConfigCommon {...props} />);
    const formFields = component.find(PropertyConfigOption);
    expect(formFields.getElements()[0].props.model).toBe(
      'template.data.commonProperties[0].generatedId'
    );
  });

  describe('validation', () => {
    beforeEach(() => {
      props.index = -2;
    });
    it('should render the label without errors', () => {
      component = shallow(<FormConfigCommon {...props} />);
      expect(component.find('.has-error').length).toBe(0);
    });
    it('should render the label with required error', () => {
      props.formState.$form.errors['commonProperties.0.label.required'] = true;
      render();
      expect(component.find('.has-error').length).toBe(1);
    });
    it('should render the label with duplicated error', () => {
      props.formState.$form.errors['commonProperties.0.label.duplicated'] = true;
      render();
      expect(component.find('.has-error').length).toBe(1);
    });
  });
});
