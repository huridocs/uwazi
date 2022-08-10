import { Field } from 'react-redux-form';
import Immutable from 'immutable';

import FormConfigSelect from 'app/Templates/components/FormConfigSelect';
import { Select } from 'app/ReactReduxForms';
import { Warning } from 'app/Layout';
import { renderConnected } from 'app/utils/test/renderConnected';
import { store } from 'app/store';

describe('FormConfigSelect', () => {
  const thesauris = [
    { _id: 1, name: 'thesauri1' },
    { _id: 2, name: 'thesauri2' },
    { _id: 3, name: 'Judge', type: 'template' },
    { _id: 4, name: 'thesauri4' },
  ];
  const relationTypes = [
    { _id: 1, name: 'relationType1' },
    { _id: 2, name: 'relationType2' },
  ];

  const storeData = {
    getState: () => ({}),
    thesauris: Immutable.fromJS(thesauris),
    relationTypes: Immutable.fromJS(relationTypes),
    locale: 'en',
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
    translations: Immutable.fromJS([
      {
        locale: 'en',
        contexts: [
          { id: 1, values: { thesauri1: 'First thesauri' } },
          { id: 2, values: { thesauri2: 'Thesauri 2' } },
          { id: 4, values: { thesauri4: 'Another thesauri' } },
        ],
      },
    ]),
  };

  const props = {
    type: 'select',
    index: 0,
  };

  beforeAll(() => {
    spyOn(store, 'getState').and.returnValue(storeData);
  });
  const render = () => renderConnected(FormConfigSelect, props, storeData);
  it('should render fields with the correct datas', () => {
    const component = render();
    const formFields = component.find(Field);
    expect(formFields.getElements()[0].props.model).toBe('template.data.properties[0].label');
    expect(component.find(Select).props().model).toBe('template.data.properties[0].content');
  });

  it('should render the select with the translated dictionaries', () => {
    const component = render();
    expect(component.find(Select).props().options).toEqual([
      { _id: 4, name: 'Another thesauri' },
      { _id: 1, name: 'First thesauri' },
      { _id: 2, name: 'Thesauri 2' },
    ]);
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
      expect(component.find('.has-error').length).toBe(2);
    });
  });
});
