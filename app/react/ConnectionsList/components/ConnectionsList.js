import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';


import SearchBar from '#app/ConnectionsList/components/SearchBar.jsx';
import RelationshipsGraph from '#app/Relationships/components/RelationshipsGraphEdit.jsx';
import LoadMoreRelationshipsButton from '#app/Relationships/components/LoadMoreRelationshipsButton.jsx';
import DocumentsList from '#app/Layout/DocumentsList.jsx';
import { SortButtons } from '#app/Library/components/SortButtons.jsx';
import { searchReferences } from '#app/ConnectionsList/actions/actions.js';
import ImmutableLib from 'immutable';

const { fromJS: Immutable } = ImmutableLib;
export function mapStateToProps({ relationships }) {
  const documents = relationships.list.searchResults;

  return {
    documents,
    connections: {
      totalRows: (documents.get('rows') || Immutable([]))
        .filter(r => r.get('sharedId') !== relationships.list.sharedId)
        .reduce((total, r) => total + r.get('connections').size, 0),
    },
    filters: Immutable({ documentTypes: [] }),
    search: relationships.list.sort,
    sortButtonsStateProperty: 'relationships/list.sort',
    SearchBar,
    SortButtons,
    GraphView: RelationshipsGraph,
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

export default connect(mapStateToProps, mapDispatchToProps)(DocumentsList);
