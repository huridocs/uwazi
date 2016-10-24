import React from 'react';
import {shallow} from 'enzyme';
import Immutable from 'immutable';

import {TranslationsList} from '../TranslationsList';

describe('TranslationsList', () => {
  let component;
  let props;
  let context;

  beforeEach(() => {
    props = {
      translations: Immutable.fromJS([{key: 'es', contexts: [{id: '1', label: 'Test'}, {id: '2', label: 'Test 2'}]}]),
      settings: Immutable.fromJS({languages: [{locale: 'es', default: true}]})
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
      let renderedContexts = component.find('ul.relation-types').find('li');
      expect(renderedContexts.length).toBe(2);
    });
  });
});
