import React from 'react';
import { shallow } from 'enzyme';
import { I18NLink } from 'app/I18N';

import { LibraryModeToggleButtons } from '../LibraryModeToggleButtons';

describe('LibraryModeToggleButtons', () => {
  let component;
  let props;

  const render = () => {
    component = shallow(<LibraryModeToggleButtons {...props} />);
  };

  describe('render()', () => {
    it('should render two links to the library and the map', () => {
      props = {
        searchUrl: '?q="asd"'
      };
      render();

      expect(component.find(I18NLink).length).toBe(2);
      expect(component.find(I18NLink).at(0).props().to).toBe('/library/?q="asd"');
      expect(component.find(I18NLink).at(1).props().to).toBe('/library/map/?q="asd"');
    });
  });
});
