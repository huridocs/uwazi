import { NeedAuthorization } from 'app/Auth';
import { t, Translate } from 'app/I18N';
import SidePanel from 'app/Layout/SidePanel';
import { resetFilters } from 'app/Library/actions/filterActions';
import { searchDocuments } from 'app/Library/actions/libraryActions';
import FiltersForm from 'app/Library/components/FiltersForm';
import { wrapDispatch } from 'app/Multireducer';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { actions as formActions, Field } from 'react-redux-form';
import { bindActionCreators } from 'redux';
import { Icon } from 'UI';
import { hideFilters } from 'app/Entities/actions/uiActions';
import { LibrarySidePanelButtons } from 'app/Library/components/LibrarySidePanelButtons';

function toggleByPublishStatus(storeKey, key) {
  return (dispatch, getState) => {
    const { search } = getState()[storeKey];
    dispatch(formActions.change(`${storeKey}.search.${key}`, !search[key]));
    dispatch(searchDocuments({}, storeKey));
  };
}

export class LibraryFilters extends Component {
  reset() {
    this.props.resetFilters(this.props.storeKey);
  }

  render() {
    return (
      <SidePanel className="library-filters" mode={this.props.sidePanelMode} open={this.props.open}>
        <div className="sidepanel-footer">
          <LibrarySidePanelButtons storeKey={this.props.storeKey} />
        </div>
        <div className="sidepanel-body">
          <div className="sidepanel-title">
            <div>{t('System', 'Filters configuration')}</div>
            <div className="filter-buttons">
              <div
                className={`clear-button push-left ${
                  this.props.sidePanelMode === 'unpinned-mode' ? '' : 'remove-margin'
                }`}
                onClick={this.reset.bind(this)}
              >
                <Icon icon="times" />
                &nbsp;<Translate>Clear Filters</Translate>
              </div>
              <button
                type="button"
                className={`closeSidepanel ${
                  this.props.sidePanelMode === 'unpinned-mode' ? '' : 'only-mobile'
                }`}
                onClick={this.props.hideFilters}
                aria-label="Close side panel"
              >
                <Icon icon="times" />
              </button>
            </div>
          </div>
          <NeedAuthorization>
            <Field
              model={`${this.props.storeKey}.search.includeUnpublished`}
              className="nested-selector multiselectItem admin-filter"
              onClick={() =>
                this.props.toggleByPublishStatus(this.props.storeKey, 'includeUnpublished')
              }
            >
              <input type="checkbox" className="multiselectItem-input" id="published" />
              <label className="multiselectItem-label">
                <span className="multiselectItem-icon">
                  <Icon icon={['far', 'square']} className="checkbox-empty" />
                  <Icon icon="check" className="checkbox-checked" />
                </span>
                <span className="multiselectItem-name">
                  <Icon icon="globe-africa" />
                  Published
                </span>
              </label>
            </Field>
            <Field
              model={`${this.props.storeKey}.search.unpublished`}
              className="nested-selector multiselectItem admin-filter"
              onClick={() => this.props.toggleByPublishStatus(this.props.storeKey, 'unpublished')}
            >
              <input type="checkbox" className="multiselectItem-input" id="restricted" />
              <label className="multiselectItem-label">
                <span className="multiselectItem-icon">
                  <Icon icon={['far', 'square']} className="checkbox-empty" />
                  <Icon icon="check" className="checkbox-checked" />
                </span>
                <span className="multiselectItem-name">
                  <Icon icon="lock" />
                  Restricted
                </span>
              </label>
            </Field>
          </NeedAuthorization>

          <FiltersForm storeKey={this.props.storeKey} />
        </div>
      </SidePanel>
    );
  }
}

LibraryFilters.defaultProps = {
  open: false,
  storeKey: 'library',
  sidePanelMode: '',
  hideFilters: () => {},
  unpublished: false,
  includeUnpublished: false,
};

LibraryFilters.propTypes = {
  resetFilters: PropTypes.func.isRequired,
  toggleByPublishStatus: PropTypes.func.isRequired,
  open: PropTypes.bool,
  storeKey: PropTypes.string,
  sidePanelMode: PropTypes.string,
  hideFilters: PropTypes.func,
  unpublished: PropTypes.bool,
  includeUnpublished: PropTypes.bool,
};

export function mapStateToProps(state, props) {
  const noDocumentSelected = state[props.storeKey].ui.get('selectedDocuments').size === 0;
  const isFilterShown = state[props.storeKey].ui.get('filtersPanel') !== false;
  return {
    open: noDocumentSelected && isFilterShown,
    unpublished: (state[props.storeKey].search || {}).unpublished,
    includeUnpublished: (state[props.storeKey].search || {}).includeUnpublished,
  };
}

function mapDispatchToProps(dispatch, props) {
  return bindActionCreators(
    { resetFilters, toggleByPublishStatus, hideFilters },
    wrapDispatch(dispatch, props.storeKey)
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(LibraryFilters);
