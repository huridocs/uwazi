import { Form } from 'react-redux-form';
import Immutable from 'immutable';
import React from 'react';

import { SearchBar, mapStateToProps } from 'app/Library/components/SearchBar';
import { shallow } from 'enzyme';

describe('SearchBar', () => {
  let component;
  let props;

  beforeEach(() => {
    props = jasmine.createSpyObj(['searchDocuments', 'change', 'semanticSearch']);
    props.search = { searchTerm: 'Find my document', sort: 'title', filters: { isBatman: true } };
    props.storeKey = 'library';
    component = shallow(<SearchBar {...props} />);
  });

  describe('form on submit', () => {
    it('should call searchDocuments, with the searchTerm filters and sort', () => {
      component.find(Form).simulate('submit', 'SEARCH MODEL VALUES');
      expect(props.searchDocuments).toHaveBeenCalledWith(
        { search: 'SEARCH MODEL VALUES' },
        props.storeKey
      );
    });
  });

  describe('maped state', () => {
    it('should contain the searchTerm', () => {
      const store = {
        library: {
          ui: Immutable.fromJS({ filtersPanel: true }),
          search: { searchTerm: 'search' },
          filters: Immutable.fromJS({ properties: [], documentTypes: [] }),
        },
      };

      const state = mapStateToProps(store, { storeKey: 'library' });
      expect(state).toEqual({
        search: { searchTerm: 'search', filters: {}, limit: undefined, types: [] },
      });
    });
  });
});
