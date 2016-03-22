import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';
import SearchBar from '../SearchBar.js';
import {events} from '../../../utils/index';

describe('SearchBar', () => {
  let searchBar;

  beforeEach(() => {
    searchBar = TestUtils.renderIntoDocument(<SearchBar/>);
  });

  describe('onSubmit', () => {
    it('should emit an event with the search string', (done) => {
      events.on('search', (queryString) => {
        expect(queryString).toBe('Do a barrel roll');
        done();
      });
      searchBar.field.value = 'Do a barrel roll';
      TestUtils.Simulate.change(searchBar.field);
      TestUtils.Simulate.submit(ReactDOM.findDOMNode(searchBar));
    });
  });
});
