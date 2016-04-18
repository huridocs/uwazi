import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {openPanel} from 'app/Viewer/actions/uiActions';

export class ViewerTextSelectedMenu extends Component {
  render() {
    return (
      <div className={this.props.active ? 'active' : ''}>
        <div onClick={this.props.openPanel.bind(null, 'referencePanel')} className="float-btn__sec">
          <span>Reference to a document</span>
          <i className="fa fa-file-o"></i>
        </div>
        <div className="float-btn__sec" onClick={this.props.openPanel.bind(null, 'targetReferencePanel')}>
          <span>Reference to a paragraph</span>
          <i className="fa fa-file-text-o"></i>
        </div>
        <div className="float-btn__sec"><span>Write a comment</span><i className="fa fa-comment"></i></div>
        <div className="float-btn__sec"><span>Add to bookmarks</span><i className="fa fa-bookmark"></i></div>
        <div className="float-btn__main"><i className="fa fa-plus"></i></div>
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
