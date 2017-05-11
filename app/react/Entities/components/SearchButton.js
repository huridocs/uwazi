import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';

import {showFilters, hideFilters} from 'app/Entities/actions/uiActions';
import {SearchButton} from 'app/Library/components/SearchButton';

export function mapStateToProps({entityView}) {
  return {
    open: entityView.uiState.get('showFilters')
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    showFilters,
    hideFilters,
    unselectAllDocuments: () => {}
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(SearchButton);
