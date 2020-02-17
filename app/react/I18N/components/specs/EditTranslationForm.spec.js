import React from 'react';
import { shallow } from 'enzyme';
import { Field, Form } from 'react-redux-form';

import Immutable from 'immutable';
import { EditTranslationForm } from '../EditTranslationForm';

describe('EditTranslationForm', () => {
  let component;
  let props;

  beforeEach(() => {
    const collectionSettings = Immutable.fromJS({
      languages: [
        { key: 'en', label: 'English', default: true },
        { key: 'es', label: 'Spanish', default: false },
      ],
    });
    props = {
      saveTranslations: jasmine.createSpy('saveTranslations'),
      translationsForm: [
        {
          locale: 'en',
          contexts: [
            { id: 'System', label: 'System', values: { User: 'User', Password: 'Password' } },
          ],
        },
        {
          locale: 'es',
          contexts: [
            { id: 'System', label: 'System', values: { User: 'Usuario', Password: 'Contraseña' } },
          ],
        },
      ],
      formState: {},
      settings: { collection: collectionSettings },
      context: 'System',
    };
  });

  const render = () => {
    component = shallow(<EditTranslationForm {...props} />);
  };

  describe('Render', () => {
    it('should render a form with fields for each value and each language', () => {
      render();
      const fields = component.find(Field);
      expect(fields.length).toBe(4);
    });

    it('should render fields alphabetically', () => {
      render();
      const fields = component.find(Field);
      expect(fields.at(0).props().model).toEqual([
        'translationsForm',
        0,
        'contexts',
        0,
        'values',
        'Password',
      ]);
      expect(fields.at(2).props().model).toEqual([
        'translationsForm',
        0,
        'contexts',
        0,
        'values',
        'User',
      ]);
    });
  });

  describe('submit', () => {
    it('should call saveTranslations only with the context beign edited', () => {
      render();
      const translations = [
        {
          locale: 'es',
          contexts: [
            { id: 'System', values: { hello: 'hola' } },
            { id: 'superheroes', values: { batman: 'joan' } },
          ],
        },
        {
          locale: 'en',
          contexts: [
            { id: 'System', values: { hello: 'hello' } },
            { id: 'superheroes', values: { batman: 'batman' } },
          ],
        },
      ];

      const expectedSave = [
        { contexts: [{ id: 'System', values: { hello: 'hola' } }], locale: 'es' },
        { contexts: [{ id: 'System', values: { hello: 'hello' } }], locale: 'en' },
      ];
      component.find(Form).simulate('submit', translations);
      expect(props.saveTranslations).toHaveBeenCalledWith(expectedSave);
    });
  });
});
