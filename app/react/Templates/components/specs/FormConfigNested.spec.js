import FormConfigNested from 'app/Templates/components/FormConfigNested';
import { Field } from 'react-redux-form';
import { renderConnected } from 'app/utils/test/renderConnected';

describe('FormConfigNested', () => {
  let props;
  const storeData = {
    template: {
      data: {
        properties: [
          {
            nestedProperties: [
              { key: 'nestedPropOne', label: 'nested prop one' },
              { key: 'nestedPropTwo', label: 'nested prop two' },
            ],
          },
        ],
      },
      formState: {
        'properties.0.label': { valid: true, dirty: false, errors: {} },
        $form: {
          errors: {
            'properties.0.label.required': false,
            'properties.0.label.duplicated': false,
          },
        },
      },
    },
  };

  const render = () => renderConnected(FormConfigNested, props, storeData);

  beforeEach(() => {
    props = {
      index: 0,
      type: 'nested',
      setNestedProperties: jasmine.createSpy('setNestedProperties').and.returnValue({}),
    };
  });

  it('should render fields with the correct datas', () => {
    const component = render();
    const formFields = component.find(Field);
    expect(formFields.getElements()[0].props.model).toBe('template.data.properties[0].label');
  });

  describe('validation', () => {
    it('should render the label without errors', () => {
      const component = render();
      expect(component.find('.has-error').length).toBe(0);
    });
  });

  describe('when the fields are invalid and dirty or the form is submited', () => {
    it('should render the label with errors', () => {
      storeData.template.formState.$form.errors['properties.0.label.required'] = true;
      storeData.template.formState['properties.0.label'].dirty = true;
      const component = render();
      expect(component.find('.has-error').length).toBe(1);
    });

    it('should render the label with errors', () => {
      storeData.template.formState.$form.errors['properties.0.label.required'] = true;
      storeData.template.formState.submitFailed = true;
      const component = render();
      expect(component.find('.has-error').length).toBe(1);
    });
  });
});
