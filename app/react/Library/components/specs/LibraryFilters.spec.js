import Immutable from 'immutable';

import {mapStateToProps} from 'app/Library/components/LibraryFilters';

describe('LibraryFilters', () => {
  describe('maped state', () => {
    it('should contain the filters store and the filters form', () => {
      let store = {
        library: {
          filters: Immutable.fromJS({properties: 'filters state', documentTypes: ['Decision']}),
          ui: Immutable.fromJS({searchTerm: 'Zerg Rush', filtersPanel: true}),
          aggregations: Immutable.fromJS({types: {buckets: []}}),
          settings: Immutable.fromJS({collection: {filters: []}})
        },
        templates: Immutable.fromJS([])
      };

      let state = mapStateToProps(store);

      expect(state).toEqual({open: true});
    });
  });
});
