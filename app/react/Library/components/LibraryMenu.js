import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {MenuButtons} from 'app/ContextMenu';
import {actions as metadataActions} from 'app/Metadata';
import {NeedAuthorization} from 'app/Auth';
import {deleteDocument, deleteEntity} from 'app/Library/actions/libraryActions';
import ShowIf from 'app/App/ShowIf';


import {showFilters, searchDocuments} from 'app/Library/actions/libraryActions';

export class LibraryMenu extends Component {

  renderFiltersMenu() {
    if (this.props.filtersPanel) {
      return (
        <MenuButtons.Main>
          <button type="submit" form="filtersForm">
            <i className="fa fa-search"></i>
          </button>
        </MenuButtons.Main>
        );
    }
  }

  deleteDocument() {
    let selectedDocument = this.props.selectedDocument.toJS();
    this.context.confirm({
      accept: () => {
        if (selectedDocument.type === 'document') {
          this.props.deleteDocument(selectedDocument);
        }

        this.props.deleteEntity(selectedDocument);
      },
      title: 'Confirm delete',
      message: `Are you sure you want to delete: ${selectedDocument.title}?`
    });
  }

  renderDocumentMenu() {
    if (this.props.metadata._id) {
      let disabled = !this.props.metadataForm.dirty;
      return (
        <MenuButtons.Main disabled={disabled}>
          <button type="submit" form="metadataForm" disabled={disabled}>
            <i className="fa fa-save"></i>
          </button>
        </MenuButtons.Main>
        );
    }

    return (
      <NeedAuthorization>
        <div>
          <ShowIf if={this.props.selectedDocument.get('type') === 'document'}>
            <div className="float-btn__sec">
              <a href={'/api/documents/download?_id=' + this.props.selectedDocument.toJS()._id} target="_blank" >
                <span>Download</span><i className="fa fa-cloud-download"></i>
              </a>
            </div>
          </ShowIf>
          <div onClick={this.deleteDocument.bind(this)} className="float-btn__sec">
            <span>Delete</span><i className="fa fa-trash"></i>
          </div>
          <MenuButtons.Main
            onClick={() => this.props.loadInReduxForm('library.metadata', this.props.selectedDocument.toJS(), this.props.templates.toJS())}
          >
            <i className="fa fa-pencil"></i>
          </MenuButtons.Main>
          {/*<div className="float-btn__main"><i className="fa fa-ellipsis-v"></i></div>*/}
        </div>
      </NeedAuthorization>
    );
  }

  render() {
    return (
      <div>
        {(() => {
          if (this.props.selectedDocument) {
            return this.renderDocumentMenu();
          }

          return this.renderFiltersMenu();
        })()}
      </div>
    );
  }
}

LibraryMenu.propTypes = {
  filtersPanel: PropTypes.bool,
  showFilters: PropTypes.func,
  search: PropTypes.object,
  templates: PropTypes.object,
  searchDocuments: PropTypes.func,
  searchTerm: PropTypes.string,
  selectedDocument: PropTypes.object,
  loadInReduxForm: PropTypes.func,
  metadata: PropTypes.object,
  metadataForm: PropTypes.object,
  deleteDocument: PropTypes.func,
  deleteEntity: PropTypes.func
};

LibraryMenu.contextTypes = {
  confirm: PropTypes.func
};

function mapStateToProps(state) {
  return {
    selectedDocument: state.library.ui.get('selectedDocument'),
    filtersPanel: state.library.ui.get('filtersPanel'),
    searchTerm: state.library.ui.get('searchTerm'),
    templates: state.get('templates'),
    metadata: state.library.metadata,
    metadataForm: state.library.metadataForm,
    search: state.search
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    showFilters,
    searchDocuments,
    loadInReduxForm: metadataActions.loadInReduxForm,
    deleteDocument,
    deleteEntity
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(LibraryMenu);
