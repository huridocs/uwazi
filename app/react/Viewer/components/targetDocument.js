import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import Document from 'app/Viewer/components/Document';

const mapStateToProps = (state) => {
  return {
    selection: null,
    document: state.documentViewer.targetDocument,
    panelIsOpen: false,
    references: [],
    targetDocumentLoaded: false,
    className: 'targetDocument'
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    setSelection: () => {},
    unsetSelection: () => {}
  },
  dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Document);
