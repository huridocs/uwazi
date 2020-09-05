import { NeedAuthorization } from 'app/Auth';
import { t } from 'app/I18N';
import SidePanel from 'app/Layout/SidePanel';
import { resetFilters } from 'app/Library/actions/filterActions';
import { searchDocuments } from 'app/Library/actions/libraryActions';
import DocumentTypesList from 'app/Library/components/DocumentTypesList';
import FiltersForm from 'app/Library/components/FiltersForm';
import { wrapDispatch } from 'app/Multireducer';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { actions as formActions, Field } from 'react-redux-form';
import { bindActionCreators } from 'redux';
import { Icon } from 'UI';
import { hideFilters } from 'app/Entities/actions/uiActions';
import Export from './ExportButton';

function toggleIncludeUnpublished(storeKey) {
  return (dispatch, getState) => {
    const { search } = getState()[storeKey];
    dispatch(
      formActions.change(`${storeKey}.search.includeUnpublished`, !search.includeUnpublished)
    );
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
          <span onClick={this.reset.bind(this)} className="btn btn-primary">
            <Icon icon="sync" />
            <span className="btn-label">{t('System', 'Reset')}</span>
          </span>
          <button type="submit" form="filtersForm" className="btn btn-success">
            <Icon icon="search" />
            <span className="btn-label">{t('System', 'Search')}</span>
          </button>
          <Export storeKey={this.props.storeKey} />
        </div>
        <div className="sidepanel-body">
          <p className="sidepanel-title">
            {t('System', 'Filters configuration')}
            {this.props.sidePanelMode === 'wide-mode' && (
              <button type="button" className="closeSidepanel" onClick={this.props.hideFilters}>
                <Icon icon="times" />
              </button>
            )}
          </p>
          <NeedAuthorization>
            {!this.props.unpublished && (
              <Field
                model={`${this.props.storeKey}.search.includeUnpublished`}
                className="nested-selector multiselectItem"
                onClick={() => this.props.toggleIncludeUnpublished(this.props.storeKey)}
              >
                <input type="checkbox" className="multiselectItem-input" id="includeUnpublished" />
                <label className="multiselectItem-label">
                  <span className="multiselectItem-icon">
                    <Icon icon={['far', 'square']} className="checkbox-empty" />
                    <Icon icon="check" className="checkbox-checked" />
                  </span>
                  <span className="multiselectItem-name">Include unpublished documents</span>
                </label>
              </Field>
            )}
            {this.props.unpublished && (
              <div className="nested-selector multiselectItem">
                <label className="multiselectItem-label">
                  <span>Showing only unpublished documents.</span>
                </label>
              </div>
            )}
          </NeedAuthorization>

          <div className="documentTypes-selector nested-selector">
            <DocumentTypesList storeKey={this.props.storeKey} />
          </div>
          <FiltersForm storeKey={this.props.storeKey} />
        </div>
      </SidePanel>
    );
  }
}

LibraryFilters.defaultProps = {
  open: false,
  unpublished: false,
  storeKey: 'library',
  sidePanelMode: '',
  hideFilters: () => {},
};

LibraryFilters.propTypes = {
  resetFilters: PropTypes.func.isRequired,
  toggleIncludeUnpublished: PropTypes.func.isRequired,
  open: PropTypes.bool,
  unpublished: PropTypes.bool,
  storeKey: PropTypes.string,
  sidePanelMode: PropTypes.string,
  hideFilters: PropTypes.func,
};

export function mapStateToProps(state, props) {
  const noDocumentSelected = state[props.storeKey].ui.get('selectedDocuments').size === 0;
  const isFilterShown = state[props.storeKey].ui.get('filtersPanel') !== false;
  return {
    open: noDocumentSelected && isFilterShown,
    unpublished: (state[props.storeKey].search || {}).unpublished,
  };
}

function mapDispatchToProps(dispatch, props) {
  return bindActionCreators(
    { resetFilters, toggleIncludeUnpublished, hideFilters },
    wrapDispatch(dispatch, props.storeKey)
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(LibraryFilters);
