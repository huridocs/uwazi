import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Immutable from 'immutable';

import { ConnectionSearchBar } from '#app/ConnectionsList/components/SearchBar.js';
import { RelationshipsGraphEdit } from '#app/Relationships/components/RelationshipsGraphEdit.js';
import { LoadMoreRelationshipsButton } from '#app/Relationships/components/LoadMoreRelationshipsButton.js';
import { DocumentsListWithRouter } from '#app/Layout/DocumentsList.js';
import { SortButtons } from '#app/Library/components/SortButtons.js';
import { searchReferences } from '../actions/actions.js';

export function mapStateToProps({ relationships }) {
  const documents = relationships.list.searchResults;

  return {
    documents,
    connections: {
      totalRows: (documents.get('rows') || Immutable.List([]))
        .filter(r => r.get('sharedId') !== relationships.list.sharedId)
        .reduce((total, r) => total + r.get('connections').size, 0),
    },
    filters: Immutable.Map({ documentTypes: [] }),
    search: relationships.list.sort,
    sortButtonsStateProperty: 'relationships/list.sort',
    SearchBar: ConnectionSearchBar,
    SortButtons,
    GraphView: RelationshipsGraphEdit,
    view: 'graph',
    LoadMoreButton: LoadMoreRelationshipsButton,
    connectionsGroups: relationships.list.connectionsGroups,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      searchDocuments: searchReferences,
    },
    dispatch
  );
}

const ConnectionsListConnected = connect(mapStateToProps, mapDispatchToProps)(DocumentsListWithRouter);
export { ConnectionsListConnected as ConnectionsList };
