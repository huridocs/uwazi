import { Field } from 'react-redux-form';
import { renderConnected } from 'app/utils/test/renderConnected';
import FormConfigInput from '../FormConfigInput';
import PropertyConfigOptions from '../PropertyConfigOptions';

describe('FormConfigInput', () => {
  let props;

  beforeEach(() => {
    props = {
      type: 'text',
      index: 0,
      property: { label: '' },
    };
  });

  const render = storeData => renderConnected(FormConfigInput, props, storeData);

  it('should render Fields with the correct datas', () => {
    const component = render();
    const formFields = component.find(Field);
    expect(formFields.getElements()[0].props.model).toBe('template.data.properties[0].label');
    expect(component.find(PropertyConfigOptions).props().canBeFilter).toBe(true);
  });

  describe('validation', () => {
    it('should render the label without errors', () => {
      const component = render();
      expect(component.find('.has-error').length).toBe(0);
    });
  });

  describe('options', () => {
    it('should pass on the canBeFilter option', () => {
      props.canBeFilter = false;
      const component = render();
      expect(component.find(PropertyConfigOptions).props().canBeFilter).toBe(false);
    });
  });

  describe('when the field is invalid and dirty or the form is submited', () => {
    it('should render the label with errors', () => {
      props.index = 0;

      const storeData = {
        template: {
          formState: {
            fields: [],
            $form: {
              errors: {
                'properties.0.label.required': true,
              },
            },
          },
        },
      };

      const component = render(storeData);
      expect(component.find('.has-error').length).toBe(1);
    });
  });
});
