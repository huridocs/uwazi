import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {showModal} from 'app/Modals/actions/modalActions';
import {showFilters} from 'app/Library/actions/libraryActions';

export class LibraryMenu extends Component {
  render() {
    return (
      <div>
        {(() => {
          if (this.props.filtersPanel) {
            return (
              <div className="float-btn__main cta" onClick={this.props.searchDocuments}>
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
  searchDocuments: PropTypes.func
};

function mapStateToProps(state) {
  return {
    filtersPanel: state.library.ui.get('filtersPanel')
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({showModal, showFilters}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(LibraryMenu);
