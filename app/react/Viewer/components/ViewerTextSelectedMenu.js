import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {addToToc} from '../actions/documentActions';

import {openPanel} from 'app/Viewer/actions/uiActions';

export class ViewerTextSelectedMenu extends Component {
  render() {
    return (
      <div className={this.props.active ? 'active' : ''}>
        <div className="float-btn__sec" onClick={this.props.openPanel.bind(null, 'targetReferencePanel')}>
          <span>Connect to a paragraph</span>
          <i className="fa fa-paragraph"></i>
        </div>
        <div onClick={this.props.openPanel.bind(null, 'referencePanel')} className="float-btn__sec">
          <span>Connect to a document</span>
          <i className="fa fa-file-o"></i>
        </div>
        <div onClick={this.props.openPanel.bind(null, 'referencePanel')} className="float-btn__sec">
          <span>Connect to a document</span>
          <i className="fa fa-file-o"></i>
        </div>
        <div onClick={this.props.addToToc.bind(null, this.props.reference.toJS())} className="float-btn__sec">
          <span>Add to table of contents</span>
          <i className="fa fa-list"></i>
        </div>
        <div className="float-btn__main cta"><i className="fa fa-plus"></i></div>
      </div>
    );
  }
}

ViewerTextSelectedMenu.propTypes = {
  openPanel: PropTypes.func,
  closeMenu: PropTypes.func,
  addToToc: PropTypes.func,
  active: PropTypes.bool,
  reference: PropTypes.object
};

function mapStateToProps({documentViewer}) {
  return {
    reference: documentViewer.uiState.get('reference')
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({openPanel, addToToc}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ViewerTextSelectedMenu);
