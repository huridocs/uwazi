import React from 'react';

import { shallow } from 'enzyme';

import { events } from '../../../utils/index';
import SearchBar from '../SearchBar.js';

describe('SearchBar', () => {
  let searchBar;

  beforeEach(() => {
    searchBar = shallow(<SearchBar/>);
  });

  describe('onSubmit', () => {
    it('should emit an event with the search string', (done) => {
      events.on('search', (queryString) => {
        expect(queryString).toBe('Do a barrel roll');
        done();
      });
      searchBar.instance().setState({ search: 'Do a barrel roll' });
      searchBar.simulate('change', { preventDefault: () => {} });
      searchBar.simulate('submit', { preventDefault: () => {} });
    });
  });
});
