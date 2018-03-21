import {fromJS as Immutable} from 'immutable';
import {mapStateToProps} from '../ConnectionsList';

import RelationshipsGraph from 'app/Relationships/components/RelationshipsGraphEdit';

describe('ConnectionsList', () => {
  describe('mapStateToProps', () => {
    let state;
    let props;

    beforeEach(() => {
      state = {
        relationships: {
          list: {
            entityId: 'id1',
            searchResults: Immutable({rows: [
              {sharedId: 'id2', connections: ['a', 'b']},
              {sharedId: 'id1', connections: ['c']},
              {sharedId: 'id2', connections: ['d']}
            ]}),
            sort: 'sort'
          }
        }
      };

      props = mapStateToProps(state);
    });

    it('should pass the documents and search from the state', () => {
      expect(props.documents).toEqual(state.relationships.list.searchResults);
      expect(props.search).toBe('sort');
    });

    it('should define the filters and sortButtonsStateProperty props', () => {
      expect(props.filters.toJS()).toEqual({documentTypes: []});
      expect(props.sortButtonsStateProperty).toBe('relationships/list.sort');
    });

    it('should pass action graph view elements', () => {
      expect(props.GraphView).toBe(RelationshipsGraph);
    });

    it('should calculate the number of connections', () => {
      expect(props.connections.totalRows).toBe(3);
    });

    it('should pass the view type', () => {
      expect(props.view).toBe('graph');
    });
  });
});
