import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {openPanel} from 'app/Viewer/actions/uiActions';

export class ViewerDefaultMenu extends Component {
  render() {
    return (
      <div className={this.props.active ? 'active' : ''}>
        <div onClick={this.props.openPanel.bind(null, 'viewMetadataPanel')} className="float-btn__sec view-metadata">
          <span>View metadata</span>
          <i className="fa fa-list-alt">
          </i>
        </div>
        <div onClick={this.props.openPanel.bind(null, 'viewReferencesPanel')} className="float-btn__sec view-references">
          <span>View relationships</span>
          <i className="fa fa-link"></i>
        </div>
        <div className="float-btn__main"><i className="fa fa-bar-chart"></i></div>
      </div>
    );
  }
}

ViewerDefaultMenu.propTypes = {
  active: PropTypes.bool,
  openPanel: PropTypes.func
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({openPanel}, dispatch);
}

export default connect(null, mapDispatchToProps)(ViewerDefaultMenu);
