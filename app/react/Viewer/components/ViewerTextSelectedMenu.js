import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {addToToc} from '../actions/documentActions';

import {actions as connectionsActions} from 'app/Connections';
import {openPanel} from 'app/Viewer/actions/uiActions';

export class ViewerTextSelectedMenu extends Component {
  showPanel(type) {
    this.props.openPanel('viewMetadataPanel');
    this.props.startNewConnection(type, this.props.doc.get('sharedId'));
  }

  render() {
    return (
      <div className={this.props.active ? 'active' : ''}>
        <div className="ContextMenu-item"
             onClick={this.showPanel.bind(this, 'targetRanged')}>
          <span>Connect to a paragraph</span>
          <i className="fa fa-paragraph"></i>
        </div>
        <div className="ContextMenu-item"
             onClick={this.showPanel.bind(this, 'ranged')} >
          <span>Connect to a document</span>
          <i className="fa fa-file-o"></i>
        </div>
        <div className="ContextMenu-item"
             onClick={this.props.addToToc.bind(null, this.props.reference.toJS())}>
          <span>Add to table of contents</span>
          <i className="fa fa-list"></i>
        </div>
      </div>
    );
  }
}

ViewerTextSelectedMenu.propTypes = {
  doc: PropTypes.object,
  reference: PropTypes.object,
  startNewConnection: PropTypes.func,
  openPanel: PropTypes.func,
  addToToc: PropTypes.func,
  active: PropTypes.bool
};

function mapStateToProps({documentViewer}) {
  return {
    doc: documentViewer.doc,
    reference: documentViewer.uiState.get('reference')
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    startNewConnection: connectionsActions.startNewConnection,
    openPanel,
    addToToc
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ViewerTextSelectedMenu);
