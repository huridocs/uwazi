import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {I18NLink} from 'app/I18N';

import {newEntity} from 'app/Uploads/actions/uploadsActions';
import ShowIf from 'app/App/ShowIf';

import {deleteDocument, deleteEntity, moveToLibrary, publishEntity, finishEdit} from 'app/Uploads/actions/uploadsActions';

export class UploadsMenu extends Component {

  deleteDocument() {
    this.context.confirm({
      accept: () => {
        this.props.finishEdit();
        if (this.props.metadataBeingEdited.type === 'document') {
          this.props.deleteDocument(this.props.metadataBeingEdited);
          return;
        }

        this.props.deleteEntity(this.props.metadataBeingEdited);
      },
      title: 'Confirm delete',
      message: `Are you sure you want to delete: ${this.props.metadataBeingEdited.title}?`
    });
  }

  publish() {
    this.context.confirm({
      accept: () => {
        if (this.props.metadataBeingEdited.type === 'document') {
          this.props.moveToLibrary(this.props.metadataBeingEdited);
        }

        this.props.publishEntity(this.props.metadataBeingEdited);
        this.props.finishEdit();
      },
      title: 'Confirm publish',
      message: `Are you sure you want to make ${this.props.metadataBeingEdited.title} public?`,
      type: 'success'
    });
  }

  renderMetadataMenu(metadataBeingEdited) {
    return <div>
      {/** /}
      <ShowIf if={!!metadataBeingEdited.template}>
        <div className="float-btn__sec publish" onClick={() => this.publish()}>
          <span>Publish</span><i className="fa fa-send"></i>
        </div>
      </ShowIf>
      <ShowIf if={!!metadataBeingEdited.processed && metadataBeingEdited.type === 'document'}>
        <div className="float-btn__sec view">
          <I18NLink to={`document/${metadataBeingEdited._id}`}><span>View</span><i className="fa fa-file-o"></i></I18NLink>
        </div>
      </ShowIf>
      <ShowIf if={!!metadataBeingEdited._id && metadataBeingEdited.type === 'entity'}>
        <div className="float-btn__sec view">
          <I18NLink to={`entity/${metadataBeingEdited._id}`}><span>View</span><i className="fa fa-file-o"></i></I18NLink>
        </div>
      </ShowIf>
      <ShowIf if={!!metadataBeingEdited._id}>
        <div className="float-btn__sec delete" onClick={() => this.deleteDocument()}>
          <span>Delete</span><i className="fa fa-trash"></i>
        </div>
      </ShowIf>
      <div className="float-btn__main cta">
        <button type="submit" form="metadataForm"><span>Save</span><i className="fa fa-save"></i></button>
      </div>
      {/**/}
    </div>;
  }

  renderNormalMenu() {
    return <div>
      <div className="float-btn__main cta">
        <button onClick={this.props.newEntity.bind(null, this.props.templates.toJS().filter((template) => template.isEntity))}>
          <span>New Entity</span><i className="fa fa-plus"></i>
        </button>
      </div>
    </div>;
  }

  render() {
    if (this.props.metadataBeingEdited) {
      return this.renderMetadataMenu(this.props.metadataBeingEdited);
    }

    return this.renderNormalMenu();
  }
}

UploadsMenu.propTypes = {
  active: PropTypes.bool,
  metadataBeingEdited: PropTypes.object,
  deleteEntity: PropTypes.func,
  deleteDocument: PropTypes.func,
  newEntity: PropTypes.func,
  moveToLibrary: PropTypes.func,
  publishEntity: PropTypes.func,
  finishEdit: PropTypes.func,
  templates: PropTypes.object
};

UploadsMenu.contextTypes = {
  confirm: PropTypes.func
};

function mapStateToProps(state) {
  let docId = state.uploads.uiState.get('documentBeingEdited');
  return {
    documentBeingEdited: docId,
    metadataBeingEdited: state.uploads.uiState.get('metadataBeingEdited'),
    templates: state.templates
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({deleteDocument, deleteEntity, newEntity, moveToLibrary, publishEntity, finishEdit}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(UploadsMenu);
