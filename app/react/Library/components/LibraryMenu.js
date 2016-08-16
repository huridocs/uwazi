import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {MenuButtons} from 'app/ContextMenu';
import documents from 'app/Documents';
import {NeedAuthorization} from 'app/Auth';
import {deleteDocument} from 'app/Library/actions/libraryActions';


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
    this.context.confirm({
      accept: () => {
        this.props.deleteDocument(this.props.selectedDocument.toJS());
      },
      title: 'Confirm delete document',
      message: 'Are you sure you want to delete this document?'
    });
  }

  renderDocumentMenu() {
    if (this.props.docForm._id) {
      let disabled = !this.props.docFormState.dirty;
      return (
        <MenuButtons.Main disabled={disabled}>
          <button type="submit" form="documentForm" disabled={disabled}>
            <i className="fa fa-save"></i>
          </button>
        </MenuButtons.Main>
        );
    }

    return (
      <NeedAuthorization>
        <div>
          <div className="float-btn__sec">
            <a href={'/api/documents/download?_id=' + this.props.selectedDocument.toJS()._id} target="_blank" >
              <span>Download</span><i className="fa fa-cloud-download"></i>
            </a>
          </div>
          <div onClick={this.deleteDocument.bind(this)} className="float-btn__sec">
            <span>Delete</span><i className="fa fa-trash"></i>
          </div>
          <MenuButtons.Main
            onClick={() => this.props.loadDocument('library.docForm', this.props.selectedDocument.toJS(), this.props.templates.toJS())}
          >
            <i className="fa fa-pencil"></i>
          </MenuButtons.Main>
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
  loadDocument: PropTypes.func,
  docForm: PropTypes.object,
  docFormState: PropTypes.object,
  deleteDocument: PropTypes.func
};

LibraryMenu.contextTypes = {
  confirm: PropTypes.func
};

function mapStateToProps(state) {
  return {
    selectedDocument: state.library.ui.get('selectedDocument'),
    filtersPanel: state.library.ui.get('filtersPanel'),
    searchTerm: state.library.ui.get('searchTerm'),
    templates: state.library.filters.get('templates'),
    docForm: state.library.docForm,
    docFormState: state.library.docFormState,
    search: state.search
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    showFilters,
    searchDocuments,
    loadDocument: documents.actions.loadDocument,
    deleteDocument
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(LibraryMenu);
