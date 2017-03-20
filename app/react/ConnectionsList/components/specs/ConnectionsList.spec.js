import {fromJS as Immutable} from 'immutable';
import {mapStateToProps} from '../ConnectionsList';

describe('ConnectionsList', () => {
  describe('mapStateToProps', () => {
    let state;
    let props;

    beforeEach(() => {
      state = {
        connectionsList: {
          searchResults: Immutable({rows: [{connections: ['a', 'b']}, {connections: ['c']}]}),
          sort: 'sort'
        }
      };

      props = mapStateToProps(state);
    });

    it('should pass the documents and search from the state', () => {
      expect(props.documents).toEqual(state.connectionsList.searchResults.toJS());
      expect(props.search).toBe('sort');
    });

    it('should define the filters and sortButtonsStateProperty props', () => {
      expect(props.filters.toJS()).toEqual({documentTypes: []});
      expect(props.sortButtonsStateProperty).toBe('connectionsList.sort');
    });

    it('should calculate the number of connections', () => {
      expect(props.connections.totalRows).toBe(3);
    });
  });
});
