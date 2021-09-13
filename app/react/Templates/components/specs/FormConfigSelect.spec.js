import { Field } from 'react-redux-form';
import Immutable from 'immutable';

import FormConfigSelect from 'app/Templates/components/FormConfigSelect';
import { Select } from 'app/ReactReduxForms';
import { Warning } from 'app/Layout';

import { renderConnected } from '../../../utils/test/renderConnected.tsx';

describe('FormConfigSelect', () => {
  let thesauris;
  let relationTypes;
  let props;
  let storeData;

  const render = () => renderConnected(FormConfigSelect, props, storeData);

  beforeEach(() => {
    thesauris = [
      { _id: 1, name: 'thesauri1' },
      { _id: 2, name: 'thesauri2' },
      { _id: 3, name: 'Judge', type: 'template' },
    ];
    relationTypes = [
      { _id: 1, name: 'relationType1' },
      { _id: 2, name: 'relationType2' },
    ];

    storeData = {
      thesauris: Immutable.fromJS(thesauris),
      relationTypes: Immutable.fromJS(relationTypes),
      template: {
        data: { properties: [{}] },
        formState: {
          $form: {
            errors: {
              'properties.0.label.required': false,
              'properties.0.label.duplicated': false,
              'properties.0.content.required': false,
            },
          },
        },
      },
    };

    props = {
      type: 'select',
      index: 0,
    };
  });

  it('should render fields with the correct datas', () => {
    const component = render();
    const formFields = component.find(Field);
    expect(formFields.getElements()[0].props.model).toBe('template.data.properties[0].label');
    expect(component.find(Select).props().model).toBe('template.data.properties[0].content');
  });

  it('should render the select with the dictionaries', () => {
    const component = render();
    const expectedOptions = [thesauris[0], thesauris[1]];
    expect(component.find(Select).props().options).toEqual(expectedOptions);
  });

  describe('validation', () => {
    it('should render the label without errors', () => {
      const component = render();
      expect(component.find('.has-error').length).toBe(0);
    });
  });

  describe('when changing content', () => {
    it('should show a warning', () => {
      storeData.template.data.properties = [{ content: '1' }];
      const component = render();

      expect(component.find(Warning).length).toBe(0);

      component.setProps({ content: '2' });

      expect(component.find(Warning).length).toBe(1);

      component.setProps({ content: '1' });

      expect(component.find(Warning).length).toBe(0);
    });
  });

  describe('when the fields are invalid and dirty or the form is submited', () => {
    it('should render the label with errors', () => {
      storeData.template.formState.$form.errors['properties.0.label.required'] = true;
      const component = render();
      expect(component.find('.has-error').length).toBe(1);
    });

    it('should render the list select with errors', () => {
      storeData.template.formState.$form.errors['properties.0.content.required'] = true;
      storeData.template.formState.$form.submitFailed = true;
      const component = render();
      expect(component.find('.has-error').length).toBe(1);
    });
  });
});
