"use strict";var _immutable = require("immutable");
var _RelationshipsGraphEdit = _interopRequireDefault(require("../../../Relationships/components/RelationshipsGraphEdit"));
var _ConnectionsList = require("../ConnectionsList");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}


describe('ConnectionsList', () => {
  describe('mapStateToProps', () => {
    let state;
    let props;

    beforeEach(() => {
      state = {
        relationships: {
          list: {
            sharedId: 'id1',
            searchResults: (0, _immutable.fromJS)({ rows: [
              { sharedId: 'id2', connections: ['a', 'b'] },
              { sharedId: 'id1', connections: ['c'] },
              { sharedId: 'id2', connections: ['d'] }] }),

            sort: 'sort' } } };




      props = (0, _ConnectionsList.mapStateToProps)(state);
    });

    it('should pass the documents and search from the state', () => {
      expect(props.documents).toEqual(state.relationships.list.searchResults);
      expect(props.search).toBe('sort');
    });

    it('should define the filters and sortButtonsStateProperty props', () => {
      expect(props.filters.toJS()).toEqual({ documentTypes: [] });
      expect(props.sortButtonsStateProperty).toBe('relationships/list.sort');
    });

    it('should pass action graph view elements', () => {
      expect(props.GraphView).toBe(_RelationshipsGraphEdit.default);
    });

    it('should calculate the number of connections', () => {
      expect(props.connections.totalRows).toBe(3);
    });

    it('should pass the view type', () => {
      expect(props.view).toBe('graph');
    });
  });
});