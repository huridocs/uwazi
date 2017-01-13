import React from 'react';
import {shallow} from 'enzyme';
import Immutable from 'immutable';
import {I18NLink} from 'app/I18N';

import {TranslationsList} from '../TranslationsList';

describe('TranslationsList', () => {
  let component;
  let props;
  let context;

  beforeEach(() => {
    props = {
      translations: Immutable.fromJS([{
        locale: 'es',
        contexts: [
          {id: '1', label: 'X-Men'},
          {id: '2', label: 'Avengers'},
          {id: '3', label: 'Batman'}
        ]
      }]),
      settings: Immutable.fromJS({languages: [{key: 'es', default: true}]})
    };

    context = {
      confirm: jasmine.createSpy('confirm')
    };
  });

  let render = () => {
    component = shallow(<TranslationsList {...props} />, {context});
  };

  describe('render', () => {
    it('should a list of the different translations contexts', () => {
      render();
      let renderedContexts = component.find('ul.relation-types').find(I18NLink);
      expect(renderedContexts.at(0).props().children).toBe('Avengers');
      expect(renderedContexts.at(2).props().children).toBe('Batman');
      expect(renderedContexts.at(4).props().children).toBe('X-Men');
    });
  });
});
