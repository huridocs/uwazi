import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {showFilters, searchDocuments} from 'app/Library/actions/libraryActions';
import {getValues} from 'redux-form';

export class LibraryMenu extends Component {
  render() {
    return (
      <div>
        {(() => {
          if (this.props.filtersPanel) {
            return (
              <div className="float-btn__main cta" onClick={
                () => this.props.searchDocuments(this.props.searchTerm, getValues(this.props.filtersForm))
              }>
                <i className="fa fa-filter fa-upload fa-save"></i>
              </div>
              );
          }
          return (
            <div className="float-btn__main cta" onClick={this.props.showFilters}>
              <i className="fa fa-filter fa-upload fa-plus"></i>
            </div>
            );
        })()}
      </div>
    );
  }
}

LibraryMenu.propTypes = {
  filtersPanel: PropTypes.bool,
  showFilters: PropTypes.func,
  filtersForm: PropTypes.object,
  searchDocuments: PropTypes.func,
  searchTerm: PropTypes.string
};

function mapStateToProps(state) {
  return {
    filtersPanel: state.library.ui.get('filtersPanel'),
    searchTerm: state.library.ui.get('searchTerm'),
    filtersForm: state.form.filters
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({showFilters, searchDocuments}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(LibraryMenu);
