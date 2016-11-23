import React from 'react';
import {shallow} from 'enzyme';
import {Field, Form} from 'react-redux-form';

import {EditTranslationForm} from '../EditTranslationForm';
import Immutable from 'immutable';

describe('EditTranslationForm', () => {
  let component;
  let props;

  beforeEach(() => {
    let collectionSettings = Immutable.fromJS({
      languages: [{key: 'en', label: 'English', default: true}, {key: 'es', label: 'Spanish', default: false}]
    });
    props = {
      saveTranslations: jasmine.createSpy('saveTranslations'),
      translationsForm: [
        {locale: 'en', contexts: [{id: 'System', label: 'System', values: {User: 'User', Password: 'Password'}}]},
        {locale: 'es', contexts: [{id: 'System', label: 'System', values: {User: 'Usuario', Password: 'Contraseña'}}]}
      ],
      formState: {},
      settings: {collection: collectionSettings},
      context: 'System'
    };
  });

  let render = () => {
    component = shallow(<EditTranslationForm {...props} />);
  };

  describe('Render', () => {
    it('should render a form with fields for each value and each language', () => {
      render();
      let fields = component.find(Field);
      expect(fields.length).toBe(4);
    });

    it('should render fields alphabetically', () => {
      render();
      let fields = component.find(Field);
      expect(fields.at(0).props().model).toBe('translationsForm[0].contexts[0].values[Password]');
      expect(fields.at(2).props().model).toBe('translationsForm[0].contexts[0].values[User]');
    });
  });

  describe('submit', () => {
    it('should call saveTranslations with the from values', () => {
      render();
      component.find(Form).simulate('submit', 'TRANSLATIONS VALUES');
      expect(props.saveTranslations).toHaveBeenCalledWith('TRANSLATIONS VALUES');
    });
  });
});
