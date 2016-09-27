import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import SidePanel from 'app/Layout/SidePanel';
import {bindActionCreators} from 'redux';
import {unselectDocument, saveDocument} from '../actions/libraryActions';

import DocumentForm from '../containers/DocumentForm';
import Immutable from 'immutable';
import EntityForm from '../containers/EntityForm';
import {actions as formActions} from 'react-redux-form';
import modals from 'app/Modals';
import {formater, ShowMetadata} from 'app/Metadata';
import {actions} from 'app/Metadata';
import {deleteDocument} from 'app/Viewer/actions/documentActions';
import {deleteEntity} from 'app/Entities/actions/actions';
import {browserHistory} from 'react-router';
import {MetadataFormButtons} from 'app/Metadata';

export class ViewMetadataPanel extends Component {

  deleteDocument() {
    this.context.confirm({
      accept: () => {
        if (this.props.metadata.type === 'document') {
          return this.props.deleteDocument(this.props.metadata)
          .then(() => {
            browserHistory.push('/');
          });
        }

        this.props.deleteEntity(this.props.metadata)
        .then(() => {
          browserHistory.push('/');
        });
      },
      title: 'Confirm delete',
      message: `Are you sure you want to delete: ${this.props.metadata.title}?`
    });
  }

  submit(doc) {
    this.props.saveDocument(doc);
  }

  close() {
    if (this.props.formState.dirty) {
      return this.props.showModal('ConfirmCloseForm', this.props.metadata);
    }
    this.props.unselectDocument();
    this.props.resetForm('library.metadata');
  }

  render() {
    const {metadata, docBeingEdited} = this.props;

    return (
      <SidePanel open={this.props.open}>
        <div className="sidepanel-header">
            <div className="item-info">
              <h1 className="item-name">test</h1>
              <span className="item-type item-type-3">
                <i className="item-type__icon fa fa-bank"></i><span className="item-type__name">Test Entity</span>
              </span>
            </div>
            <ul className="nav nav-tabs">
              <li>
                <div className="tab-link tab-link-active">
                  <i className="fa fa-info-circle"></i>
                </div>
              </li>
            </ul>
            <i className="closeSidepanel fa fa-close close-modal" onClick={this.close.bind(this)}/>&nbsp;
        </div>

        <MetadataFormButtons
          delete={this.deleteDocument.bind(this)}
          data={this.props.rawDoc}
          formStatePath='library.metadata'
          entityBeingEdited={docBeingEdited}
        />

        <div className="sidepanel-body">
          {(() => {
            if (docBeingEdited && this.props.metadata.type === 'document') {
              return <DocumentForm onSubmit={this.submit.bind(this)} />;
            }
            if (docBeingEdited && this.props.metadata.type === 'entity') {
              return <EntityForm/>;
            }
            return <ShowMetadata entity={metadata} showTitle={true} showType={true} />;
          })()}
        </div>
      </SidePanel>
    );
  }
}

ViewMetadataPanel.propTypes = {
  metadata: PropTypes.object,
  templates: PropTypes.object,
  rawDoc: PropTypes.object,
  docBeingEdited: PropTypes.bool,
  open: PropTypes.bool,
  saveDocument: PropTypes.func,
  unselectDocument: PropTypes.func,
  resetForm: PropTypes.func,
  formState: PropTypes.object,
  showModal: PropTypes.func,
  deleteDocument: PropTypes.func,
  loadInReduxForm: PropTypes.func,
  deleteEntity: PropTypes.func
};

ViewMetadataPanel.contextTypes = {
  confirm: PropTypes.func
};

const mapStateToProps = (state) => {
  return {
    open: state.library.ui.get('selectedDocument') ? true : false,
    docBeingEdited: !!state.library.metadata._id,
    formState: state.library.metadataForm,
    rawDoc: state.library.ui.get('selectedDocument') || Immutable.fromJS({}),
    templates: state.templates,
    metadata: formater.prepareMetadata(state.library.ui.get('selectedDocument') ? state.library.ui.get('selectedDocument').toJS() : {},
                                       state.templates.toJS(),
                                       state.thesauris.toJS())
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    loadInReduxForm: actions.loadInReduxForm,
    unselectDocument,
    resetForm: formActions.reset,
    saveDocument,
    deleteDocument,
    deleteEntity,
    showModal: modals.actions.showModal
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ViewMetadataPanel);
