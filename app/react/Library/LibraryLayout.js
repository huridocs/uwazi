import { t } from 'app/I18N';
import LibraryFilters from 'app/Library/components/LibraryFilters';
import { QuickLabelPanel } from 'app/Library/components/QuickLabelPanel';
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
import { QuickLabelHeader } from './components/QuickLabelHeader';

export class LibraryLayoutBase extends Component {
  render() {
    if (blankState()) {
      return <Welcome />;
    }
    const { className, children, quickLabelThesaurus, sidePanelMode } = this.props;
    const contentDivClass = `${
      quickLabelThesaurus ? 'with-header ' : ''
    } content-holder library-viewer document-viewer with-panel ${sidePanelMode} `;

    return (
      <div className="row panels-layout">
        <Helmet title={t('System', 'Library', null, false)} />
        {quickLabelThesaurus && <QuickLabelHeader />}
        <div className={contentDivClass}>
          <main className={`${className}`}>{children}</main>
          <LibraryFilters storeKey="library" sidePanelMode={sidePanelMode} />
          {!quickLabelThesaurus && <ViewMetadataPanel storeKey="library" />}
          {!quickLabelThesaurus && <SelectMultiplePanelContainer storeKey="library" />}
          {quickLabelThesaurus && <QuickLabelPanel storeKey="library" />}
          <FeatureToggleSemanticSearch>
            <SemanticSearchPanel storeKey="library" />
          </FeatureToggleSemanticSearch>
        </div>
      </div>
    );
  }
}

LibraryLayoutBase.defaultProps = {
  className: '',
  quickLabelThesaurus: '',
  sidePanelMode: '',
};

LibraryLayoutBase.propTypes = {
  children: PropTypes.instanceOf(Object).isRequired,
  className: PropTypes.string,
  quickLabelThesaurus: PropTypes.string,
  sidePanelMode: PropTypes.string,
};

export default connect(state => ({
  quickLabelThesaurus: state.library.sidepanel.quickLabelState.get('thesaurus'),
}))(LibraryLayoutBase);
