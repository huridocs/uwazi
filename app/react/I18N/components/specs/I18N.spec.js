import React from 'react';
import {shallow} from 'enzyme';
import Immutable from 'immutable';

import {I18N} from '../I18N';

describe('I18N', () => {
  let component;
  let props;

  beforeEach(() => {
    let dictionaries = [
      {locale: 'en', values: {Search: 'Search'}},
      {locale: 'es', values: {Search: 'Buscar'}}
    ];
    props = {
      locale: 'es',
      dictionaries: Immutable.fromJS(dictionaries)
    };
  });

  let render = (text) => {
    component = shallow(<I18N {...props}>{text}</I18N>);
  };

  describe('render', () => {
    it('should render the translation', () => {
      render('Search');
      expect(component.find('span').text()).toBe('Buscar');
    });

    describe('when there is no translation', () => {
      it('should render the text', () => {
        render('Not translated yet');
        expect(component.find('span').text()).toBe('Not translated yet');
      });
    });
  });
});
