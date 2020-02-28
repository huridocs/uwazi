/** @format */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Welcome from 'app/Library/components/Welcome';
import LibraryFilters from 'app/Library/components/LibraryFilters';
import Helmet from 'react-helmet';
import ViewMetadataPanel from 'app/Library/components/ViewMetadataPanel';
import SelectMultiplePanelContainer from 'app/Library/containers/SelectMultiplePanelContainer';
import SemanticSearchPanel from 'app/SemanticSearch/components/SemanticSearchPanel';
import { FeatureToggleSemanticSearch } from 'app/SemanticSearch/components/FeatureToggleSemanticSearch';
import { t } from 'app/I18N';
import blankState from './helpers/blankState';
import { withRouter } from 'react-router';

export class LibraryLayoutBase extends Component {
  render() {
    if (blankState()) {
      return <Welcome />;
    }
    const { className, children, location } = this.props;
    const thesaurusFocus = location.query.thesaurus;

    return (
      <div className="row panels-layout">
        <Helmet title={t('System', 'Library', null, false)} />
        <main className={`library-viewer document-viewer with-panel ${className}`}>{children}</main>
        <LibraryFilters storeKey="library" />
        {!thesaurusFocus && <ViewMetadataPanel storeKey="library" />}
        {!thesaurusFocus && <SelectMultiplePanelContainer storeKey="library" />}
        {thesaurusFocus && <MultiEditLabels storeKey="library" thesaurus={thesaurusFocus} />}
        <FeatureToggleSemanticSearch>
          <SemanticSearchPanel storeKey="library" />
        </FeatureToggleSemanticSearch>
      </div>
    );
  }
}

LibraryLayoutBase.defaultProps = {
  className: '',
};

LibraryLayoutBase.propTypes = {
  children: PropTypes.instanceOf(Object).isRequired,
  className: PropTypes.string,
  location: PropTypes.shape({
    pathname: PropTypes.string,
    query: PropTypes.object,
  }),
};

export default withRouter(LibraryLayoutBase);
