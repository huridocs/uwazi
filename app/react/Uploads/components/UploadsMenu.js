import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {Link} from 'react-router';

import {moveToLibrary} from 'app/Uploads/actions/uploadsActions';

export class UploadsMenu extends Component {
  render() {
    let active = this.props.active && this.props.documentBeingEdited;
    let doc = this.props.doc;
    return (
      <div className={active ? 'active' : ''}>
        {(() => {
          if (doc && doc.get('template')) {
            return <div className="float-btn__sec publish" onClick={() => this.props.moveToLibrary(doc.toJS())}>
              <span>Publish document</span><i className="fa fa-send"></i>
            </div>;
          }
        })()}
        {(() => {
          if (doc && doc.get('processed')) {
            return <div className="float-btn__sec view">
              <Link to={`document/${doc.get('_id')}`}><span>ViewDocument</span><i className="fa fa-file-o"></i></Link>
            </div>;
          }
        })()}
        {(() => {
          if (doc) {
            return <div className="float-btn__sec">
              <button type="submit" form="documentForm"><span>Save metadata</span><i className="fa fa-save"></i></button>
            </div>;
          }
        })()}
        <div className={'float-btn__main ' + (this.props.documentBeingEdited ? 'cta' : 'disabled')}>
          <i className="fa fa-gears"></i>
        </div>
      </div>
    );
  }
}

UploadsMenu.propTypes = {
  active: PropTypes.bool,
  documentBeingEdited: PropTypes.string,
  doc: PropTypes.object,
  moveToLibrary: PropTypes.func
};

function mapStateToProps(state) {
  let docId = state.uploads.uiState.get('documentBeingEdited');
  return {
    documentBeingEdited: docId,
    doc: state.uploads.documents.find(doc => doc.get('_id') === docId)
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({moveToLibrary}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(UploadsMenu);
