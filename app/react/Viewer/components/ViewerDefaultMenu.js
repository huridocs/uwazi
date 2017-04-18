import PropTypes from 'prop-types';
import React, { Component } from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import ShowIf from 'app/App/ShowIf';

import {openPanel} from 'app/Viewer/actions/uiActions';

export class ViewerDefaultMenu extends Component {
  render() {
    return (
      <div className={this.props.active ? 'active' : ''}>
        <ShowIf if={!this.props.panelIsOpen}>
          <div className="btn btn-primary" onClick={this.props.openPanel.bind(null, 'viewMetadataPanel')}>
            <i className="fa fa-bar-chart"></i>
          </div>
        </ShowIf>
      </div>
    );
  }
}

const mapStateToProps = ({documentViewer}) => {
  return {
    panelIsOpen: !!documentViewer.uiState.get('panel'),
    doc: documentViewer.doc,
    targetDoc: !!documentViewer.targetDoc.get('_id')
  };
};

ViewerDefaultMenu.propTypes = {
  active: PropTypes.bool,
  panelIsOpen: PropTypes.bool,
  targetDoc: PropTypes.bool,
  openPanel: PropTypes.func,
  doc: PropTypes.object
};

ViewerDefaultMenu.contextTypes = {
  confirm: PropTypes.func
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({openPanel}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ViewerDefaultMenu);
