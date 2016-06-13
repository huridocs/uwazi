import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {openPanel} from 'app/Viewer/actions/uiActions';

export class ViewerTextSelectedMenu extends Component {
  render() {
    return (
      <div className={this.props.active ? 'active' : ''}>
        <div className="float-btn__sec" onClick={this.props.openPanel.bind(null, 'targetReferencePanel')}>
          <span>Relationship to a paragraph</span>
          <i className="fa fa-paragraph"></i>
        </div>
        <div onClick={this.props.openPanel.bind(null, 'referencePanel')} className="float-btn__sec">
          <span>Relationship to a document</span>
          <i className="fa fa-file-o"></i>
        </div>
        <div className="float-btn__main cta"><i className="fa fa-plus"></i></div>
      </div>
    );
  }
}

ViewerTextSelectedMenu.propTypes = {
  openPanel: PropTypes.func,
  closeMenu: PropTypes.func,
  active: PropTypes.bool
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({openPanel}, dispatch);
}

export default connect(null, mapDispatchToProps)(ViewerTextSelectedMenu);
