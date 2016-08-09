import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import SidePanel from 'app/Layout/SidePanel';
import {bindActionCreators} from 'redux';
import {unselectDocument, saveDocument} from '../actions/libraryActions';

import DocumentForm from '../containers/DocumentForm';
import EntityForm from '../containers/EntityForm';
import {actions as formActions} from 'react-redux-form';
import modals from 'app/Modals';
import {formater, ShowMetadata} from 'app/Metadata';

export class ViewMetadataPanel extends Component {
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
          <h1>Metadata</h1>
          <i className="fa fa-close close-modal" onClick={this.close.bind(this)}/>
        </div>
        <div className="sidepanel-footer">
          <button className="edit-metadata btn btn-default">
            <i className="fa fa-pencil"></i>
            <span className="btn-label">Edit</span>
          </button>
          <button className="edit-metadata btn btn-default">
            <i className="fa fa-cloud-download"></i>
            <span className="btn-label">Download</span>
          </button>
          <button className="edit-metadata btn btn-default">
            <i className="fa fa-trash"></i>
            <span className="btn-label">Delete</span>
          </button>
          <button className="edit-metadata btn btn-success" disabled>
            <i className="fa fa-save"></i>
            <span className="btn-label">Save</span>
          </button>
        </div>
        <div className="sidepanel-body">
          <ul className="nav nav-tabs">
            <li>
              <a href="#">Table of content</a>
            </li>
            <li className="active">
              <a href="#">Metadata</a>
            </li>
            <li>
              <a href="#">Connections (22)</a>
            </li>
          </ul>
          {(() => {
            if (docBeingEdited && this.props.metadata.type === 'document') {
              return <DocumentForm onSubmit={this.submit.bind(this)} />;
            }
            if (docBeingEdited && this.props.metadata.type === 'entity') {
              return <EntityForm/>;
            }
            return <ShowMetadata entity={metadata}/>;
          })()}
        </div>
      </SidePanel>
    );
  }
}

ViewMetadataPanel.propTypes = {
  metadata: PropTypes.object,
  docBeingEdited: PropTypes.bool,
  open: PropTypes.bool,
  saveDocument: PropTypes.func,
  unselectDocument: PropTypes.func,
  resetForm: PropTypes.func,
  formState: PropTypes.object,
  showModal: PropTypes.func
};

const mapStateToProps = ({library}) => {
  return {
    open: library.ui.get('selectedDocument') ? true : false,
    docBeingEdited: !!library.metadata._id,
    formState: library.metadataForm,
    metadata: formater.prepareMetadata(library.ui.get('selectedDocument') ? library.ui.get('selectedDocument').toJS() : {},
                                           library.filters.get('templates').toJS(),
                                           library.filters.get('thesauris').toJS())
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({unselectDocument, resetForm: formActions.reset, saveDocument, showModal: modals.actions.showModal}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ViewMetadataPanel);
