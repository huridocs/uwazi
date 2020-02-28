/** @format */

import { t } from 'app/I18N';
import LibraryFilters from 'app/Library/components/LibraryFilters';
import MultiEditLabelsPanel from 'app/Library/components/MultiEditLabelsPanel';
import ViewMetadataPanel from 'app/Library/components/ViewMetadataPanel';
import Welcome from 'app/Library/components/Welcome';
import SelectMultiplePanelContainer from 'app/Library/containers/SelectMultiplePanelContainer';
import { FeatureToggleSemanticSearch } from 'app/SemanticSearch/components/FeatureToggleSemanticSearch';
import SemanticSearchPanel from 'app/SemanticSearch/components/SemanticSearchPanel';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';
import blankState from './helpers/blankState';

export class LibraryLayoutBase extends Component {
  render() {
    if (blankState()) {
      return <Welcome />;
    }
    const { className, children, multiEditThesaurus } = this.props;

    return (
      <div className="row panels-layout">
        <Helmet title={t('System', 'Library', null, false)} />
        <main className={`library-viewer document-viewer with-panel ${className}`}>{children}</main>
        <LibraryFilters storeKey="library" />
        {!multiEditThesaurus && <ViewMetadataPanel storeKey="library" />}
        {!multiEditThesaurus && <SelectMultiplePanelContainer storeKey="library" />}
        {multiEditThesaurus && <MultiEditLabelsPanel storeKey="library" />}
        <FeatureToggleSemanticSearch>
          <SemanticSearchPanel storeKey="library" />
        </FeatureToggleSemanticSearch>
      </div>
    );
  }
}

LibraryLayoutBase.defaultProps = {
  className: '',
  multiEditThesaurus: '',
};

LibraryLayoutBase.propTypes = {
  children: PropTypes.instanceOf(Object).isRequired,
  className: PropTypes.string,
  multiEditThesaurus: PropTypes.string,
};

export default connect(state => ({
  multiEditThesaurus: state.library.sidepanel.multiEditOpts.get('thesaurus'),
}))(LibraryLayoutBase);
