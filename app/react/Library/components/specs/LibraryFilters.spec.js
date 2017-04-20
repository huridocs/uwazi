import React from 'react';
import {shallow} from 'enzyme';
import Immutable from 'immutable';

import {LibraryFilters, mapStateToProps} from 'app/Library/components/LibraryFilters';
import SidePanel from 'app/Layout/SidePanel';

describe('LibraryFilters', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {open: true};
  });

  let render = () => {
    component = shallow(<LibraryFilters {...props} />);
  };

  it('shoud have library-filters class', () => {
    render();
    expect(component.find(SidePanel).hasClass('library-filters')).toBe(true);
  });

  describe('maped state', () => {
    it('should contain the filters store and the filters form', () => {
      let store = {
        library: {
          filters: Immutable.fromJS({properties: 'filters state', documentTypes: ['Decision']}),
          ui: Immutable.fromJS({searchTerm: 'Zerg Rush', filtersPanel: true, selectedDocuments: []}),
          aggregations: Immutable.fromJS({types: {buckets: []}}),
          settings: Immutable.fromJS({collection: {filters: []}})
        },
        templates: Immutable.fromJS([])
      };

      let state = mapStateToProps(store, {storeKey: 'library'});

      expect(state).toEqual({open: true});
    });
  });
});
