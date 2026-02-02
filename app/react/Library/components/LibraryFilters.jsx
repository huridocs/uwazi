import { t, Translate } from '#app/I18N/index.js';
import SidePanel from '#app/Layout/SidePanel.js';
import { resetFilters } from '#app/Library/actions/filterActions.js';
import FiltersForm from '#app/Library/components/FiltersForm.js';
import { wrapDispatch } from '#app/Multireducer/index.js';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Icon } from '#UI/index.js';
import { hideFilters } from '#app/Entities/actions/uiActions.js';
import { withRouter } from '#app/componentWrappers.js';

class LibraryFilters extends Component {
  reset() {
    this.props.resetFilters(this.props.navigate, this.props.location);
  }

  render() {
    return (
      <SidePanel
        className="library-filters"
        data-testid="library-filters"
        mode={this.props.sidePanelMode}
        open={this.props.open}
      >
        <div className="sidepanel-body">
          <div className="sidepanel-title">
            <div>{t('System', 'Filters configuration')}</div>
            <div className="filter-buttons">
              <button
                type="button"
                className={`closeSidepanel ${this.props.sidePanelMode === 'unpinned-mode' ? '' : 'only-mobile'
                  }`}
                onClick={this.props.hideFilters}
                aria-label="Close side panel"
              >
                <Icon icon="times" />
              </button>
            </div>
          </div>
          <FiltersForm storeKey={this.props.storeKey} />
        </div>
        <div className="sidepanel-footer">
          <button type="button" className="btn btn-default" onClick={this.reset.bind(this)}>
            <Icon icon="times" />
            <span className="btn-label">
              <Translate>Clear Filters</Translate>
            </span>
          </button>
        </div>
      </SidePanel>
    );
  }
}

LibraryFilters.defaultProps = {
  open: false,
  storeKey: 'library',
  sidePanelMode: '',
  hideFilters: () => { },
};

LibraryFilters.propTypes = {
  resetFilters: PropTypes.func.isRequired,
  open: PropTypes.bool,
  storeKey: PropTypes.string,
  sidePanelMode: PropTypes.string,
  hideFilters: PropTypes.func,
  navigate: PropTypes.func.isRequired,
  location: PropTypes.object.isRequired,
};

function mapStateToProps(state, props) {
  const noDocumentSelected = state[props.storeKey].ui.get('selectedDocuments').size === 0;
  const isFilterShown = state[props.storeKey].ui.get('filtersPanel') !== false;
  return {
    open: noDocumentSelected && isFilterShown,
  };
}

function mapDispatchToProps(dispatch, props) {
  return bindActionCreators({ resetFilters, hideFilters }, wrapDispatch(dispatch, props.storeKey));
}

export { LibraryFilters, mapStateToProps };

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(LibraryFilters));
