import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {Link} from 'react-router';

import {showModal} from 'app/Modals/actions/modalActions';
import {newEntity} from 'app/Uploads/actions/uploadsActions';

export class UploadsMenu extends Component {

  renderDocMenu(doc) {
    return <div>
      {(() => {
        if (doc.get('template')) {
          return <div className="float-btn__sec publish" onClick={() => this.props.showModal('readyToPublish', doc)}>
            <span>Publish document</span><i className="fa fa-send"></i>
          </div>;
        }
      })()}
      {(() => {
        if (doc.get('processed')) {
          return <div className="float-btn__sec view">
            <Link to={`document/${doc.get('_id')}`}><span>ViewDocument</span><i className="fa fa-file-o"></i></Link>
          </div>;
        }
      })()}
      <div className="float-btn__sec delete" onClick={() => this.props.showModal('deleteDocument', doc)}>
        <span>Delete document</span><i className="fa fa-trash"></i>
      </div>
      <div className="float-btn__main cta">
        <button type="submit" form="documentForm"><span>Save metadata</span><i className="fa fa-save"></i></button>
      </div>
    </div>;
  }

  render() {
    return <div>
            {(() => {
              if (this.props.doc) {
                return this.renderDocMenu(this.props.doc);
              }
            })()}
            {(() => {
              if (this.props.editignEntity) {
                return <div className="float-btn__main cta">
                  <button type="submit" form="entityForm"><span>Save</span><i className="fa fa-save"></i></button>
                </div>;
              }
            })()}
            {(() => {
              if (!this.props.doc && !this.props.editignEntity) {
                return <div className="float-btn__main cta">
                  <button onClick={this.props.newEntity.bind(null, this.props.templates.toJS().filter((template) => template.isEntity))}>
                    <span>New Entity</span><i className="fa fa-plus"></i>
                  </button>
                </div>;
              }
            })()}
           </div>;
  }
}

UploadsMenu.propTypes = {
  active: PropTypes.bool,
  documentBeingEdited: PropTypes.string,
  editignEntity: PropTypes.bool,
  doc: PropTypes.object,
  showModal: PropTypes.func,
  newEntity: PropTypes.func,
  templates: PropTypes.object
};

function mapStateToProps(state) {
  let docId = state.uploads.uiState.get('documentBeingEdited');
  return {
    documentBeingEdited: docId,
    doc: state.uploads.documents.find(doc => doc.get('_id') === docId),
    editignEntity: state.uploads.uiState.get('showEntityForm'),
    templates: state.uploads.templates
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({showModal, newEntity}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(UploadsMenu);
