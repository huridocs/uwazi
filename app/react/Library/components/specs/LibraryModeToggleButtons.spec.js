import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import { I18NLink } from 'app/I18N';

import { LibraryModeToggleButtons, mapStateToProps } from '../LibraryModeToggleButtons';

describe('LibraryModeToggleButtons', () => {
  let component;
  let props;

  const render = () => {
    component = shallow(<LibraryModeToggleButtons {...props} />);
  };

  describe('render()', () => {
    it('should render two links to the library and the map', () => {
      props = {
        searchUrl: '?q="asd"',
        showGeolocation: true
      };
      render();

      expect(component.find(I18NLink).length).toBe(2);
      expect(component.find(I18NLink).at(0).props().to).toBe('library?q="asd"');
      expect(component.find(I18NLink).at(1).props().to).toBe('library/map?q="asd"');
    });

    describe('when showGeolocation is false', () => {
      it('should render nothing', () => {
        props = {
          searchUrl: '?q="asd"',
          showGeolocation: false
        };
        render();
        expect(component.find('div').length).toBe(0);
      });
    });
  });

  describe('mapStateToProps()', () => {
    it('should map the search url and check if any template has a geolocation field', () => {
      props = { storeKey: 'library' };
      const state = {
       library: { search: {}, filters: Immutable.fromJS({ properties: [] }) },
       templates: Immutable.fromJS([{ properties: [{ type: 'geolocation' }] }])
      };

      const mappedProps = mapStateToProps(state, props);
      expect(mappedProps.showGeolocation).toBe(true);
      expect(mappedProps.searchUrl).toBe('?q=()');
    });
  });
});
