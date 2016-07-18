import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {MenuButtons} from 'app/ContextMenu';
import documents from 'app/Documents';
import {NeedAuthorization} from 'app/Auth';


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

    return (
      <MenuButtons.Main onClick={this.props.showFilters}>
        <i className="fa fa-filter"></i>
      </MenuButtons.Main>
      );
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
  filtersForm: PropTypes.object,
  search: PropTypes.object,
  templates: PropTypes.object,
  searchDocuments: PropTypes.func,
  searchTerm: PropTypes.string,
  selectedDocument: PropTypes.object,
  loadDocument: PropTypes.func,
  docForm: PropTypes.object,
  docFormState: PropTypes.object
};

function mapStateToProps(state) {
  return {
    selectedDocument: state.library.ui.get('selectedDocument'),
    filtersPanel: state.library.ui.get('filtersPanel'),
    searchTerm: state.library.ui.get('searchTerm'),
    templates: state.library.filters.get('templates'),
    filtersForm: state.form.filters,
    docForm: state.library.docForm,
    docFormState: state.library.docFormState,
    search: state.search
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({showFilters, searchDocuments, loadDocument: documents.actions.loadDocument}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(LibraryMenu);
