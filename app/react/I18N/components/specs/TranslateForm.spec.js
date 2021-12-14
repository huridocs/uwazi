import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import { Form, Field } from 'react-redux-form';
import Modal from 'app/Layout/Modal';
import { FormGroup } from 'app/Forms';
import { TranslateForm } from '../TranslateForm';

describe('TranslateForm', () => {
  let component;
  let props;
  const translations = Immutable.fromJS([
    {
      locale: 'en',
      contexts: [
        { id: 'System', values: { Search: 'Search', Find: 'Find' } },
        { id: '123', values: {} },
      ],
    },
    {
      locale: 'es',
      contexts: [
        { id: 'System', values: { Search: 'Buscar', Find: 'Encontrar' } },
        { id: '123', values: {} },
      ],
    },
  ]);

  beforeEach(() => {
    props = {
      saveTranslations: jasmine.createSpy('saveTranslations'),
      close: jasmine.createSpy('close'),
      isOpen: true,
      context: 'System',
      value: 'Search',
      translations,
    };
  });

  const render = () => {
    component = shallow(<TranslateForm {...props} />);
  };

  describe('render', () => {
    beforeEach(render);
    it('should render a Modal and pass isopen property', () => {
      expect(component.find(Modal).props().isOpen).toBe(true);
    });

    it('should render a LocalForm and pass submit function and initialState', () => {
      expect(component.find(Form).props().onSubmit).toBe(component.instance().submit);
      expect(component.find(Form).props().model).toBe('inlineEditModel');
    });

    it('should redner a FormGroup for each language', () => {
      expect(component.find(FormGroup).at(0).props().model).toBe('.en');
      expect(component.find(FormGroup).at(1).props().model).toBe('.es');
    });

    it('should redner a Field for each language', () => {
      expect(component.find(Field).at(0).props().model).toBe('.en');
      expect(component.find(Field).at(1).props().model).toBe('.es');
    });
  });

  describe('cancel', () => {
    it('should call props.close()', () => {
      render();
      component.instance().cancel();
      expect(props.close).toHaveBeenCalled();
    });
  });

  describe('submit', () => {
    it('should call saveTranslations with only the updated context', () => {
      const expectedTranslations = [
        {
          locale: 'en',
          contexts: [{ id: 'System', values: { Search: 'Search en', Find: 'Find' } }],
        },
        {
          locale: 'es',
          contexts: [{ id: 'System', values: { Search: 'Buscar es', Find: 'Encontrar' } }],
        },
      ];
      render();
      component.instance().submit({ en: 'Search en', es: 'Buscar es' });
      expect(props.saveTranslations).toHaveBeenCalledWith(expectedTranslations);
    });

    it('should call props.close()', () => {
      render();
      component.instance().submit({ en: 'Search en', es: 'Buscar es' });
      expect(props.close).toHaveBeenCalled();
    });
  });
});
