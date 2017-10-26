import {fromJS as Immutable} from 'immutable';
import {mapStateToProps} from '../ConnectionsList';

import ToggleStyleButtons from 'app/ConnectionsList/components/ToggleStyleButtons';
import RelationshipsGraph from 'app/Relationships/components/RelationshipsGraph';

describe('ConnectionsList', () => {
  describe('mapStateToProps', () => {
    let state;
    let props;

    beforeEach(() => {
      state = {
        connectionsList: {
          searchResults: Immutable({rows: [{connections: ['a', 'b']}, {connections: ['c']}]}),
          sort: 'sort',
          view: 'passedView'
        }
      };

      props = mapStateToProps(state);
    });

    it('should pass the documents and search from the state', () => {
      expect(props.documents).toEqual(state.connectionsList.searchResults);
      expect(props.search).toBe('sort');
    });

    it('should define the filters and sortButtonsStateProperty props', () => {
      expect(props.filters.toJS()).toEqual({documentTypes: []});
      expect(props.sortButtonsStateProperty).toBe('connectionsList.sort');
    });

    it('should pass action buttons and graph view elements', () => {
      expect(props.ActionButtons).toBe(ToggleStyleButtons);
      expect(props.GraphView).toBe(RelationshipsGraph);
    });

    it('should calculate the number of connections', () => {
      expect(props.connections.totalRows).toBe(3);
    });

    it('should pass the view type', () => {
      expect(props.view).toBe('passedView');
    });
  });
});
