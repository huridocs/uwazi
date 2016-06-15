import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {actions} from 'app/BasicReducer';
import {unsetTargetSelection, unsetSelection} from 'app/Viewer/actions/selectionActions';
import {openPanel} from 'app/Viewer/actions/uiActions';

export class TargetDocumentHeader extends Component {

  back() {
    this.props.unset('viewer/targetDoc');
    this.props.unset('viewer/targetDocHTML');
    this.props.unsetTargetSelection();
    this.props.openPanel('targetReferencePanel');
  }

  render() {
    return (
      <div className="relationship-steps">
        <button onClick={this.back.bind(this)} className="btn btn-default">
          <i className="fa fa-arrow-left"></i>
          Back
        </button>
        <h2>Select target paragraph<small>3</small></h2>
      </div>
    );
  }
}

TargetDocumentHeader.propTypes = {
  unset: PropTypes.func,
  unsetTargetSelection: PropTypes.func,
  openPanel: PropTypes.func,
  unsetSelection: PropTypes.func
};


function mapDispatchToProps(dispatch) {
  return bindActionCreators({unset: actions.unset, unsetTargetSelection, unsetSelection, openPanel}, dispatch);
}

export default connect(null, mapDispatchToProps)(TargetDocumentHeader);
