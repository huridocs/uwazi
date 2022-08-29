import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Helmet } from 'react-helmet';
import { connect } from 'react-redux';
import { t } from 'app/I18N';
import LibraryFilters from 'app/Library/components/LibraryFilters';
import { QuickLabelPanel } from 'app/Library/components/QuickLabelPanel';
import ViewMetadataPanel from 'app/Library/components/ViewMetadataPanel';
import SelectMultiplePanelContainer from 'app/Library/containers/SelectMultiplePanelContainer';
import { FeatureToggleSemanticSearch } from 'app/SemanticSearch/components/FeatureToggleSemanticSearch';
import SemanticSearchPanel from 'app/SemanticSearch/components/SemanticSearchPanel';
import ImportPanel from 'app/Uploads/components/ImportPanel';
import { QuickLabelHeader } from './components/QuickLabelHeader';
import { LibraryFooter } from './components/LibraryFooter';

class LibraryLayoutBase extends Component {
  render() {
    const { className, children, quickLabelThesaurus, sidePanelMode, noScrollable } = this.props;
    const contentDivClass = `${
      quickLabelThesaurus ? 'with-header ' : ''
    } content-holder library-viewer document-viewer with-footer with-panel ${sidePanelMode} ${
      noScrollable ? 'no-scroll-layout' : ''
    }`;

    return (
      <div className="row panels-layout">
        <Helmet>
          <title>{t('System', 'Library', null, false)}</title>
        </Helmet>
        {quickLabelThesaurus && <QuickLabelHeader />}
        <div className={contentDivClass}>
          <main className={`${className}`}>{children}</main>
          <LibraryFooter storeKey="library" />
          <LibraryFilters storeKey="library" sidePanelMode={sidePanelMode} />
          {!quickLabelThesaurus && <ViewMetadataPanel storeKey="library" />}
          {!quickLabelThesaurus && <SelectMultiplePanelContainer storeKey="library" />}
          {quickLabelThesaurus && <QuickLabelPanel storeKey="library" />}
          <FeatureToggleSemanticSearch>
            <SemanticSearchPanel storeKey="library" />
          </FeatureToggleSemanticSearch>
          <ImportPanel />
        </div>
      </div>
    );
  }
}

LibraryLayoutBase.defaultProps = {
  className: '',
  quickLabelThesaurus: '',
  sidePanelMode: '',
  noScrollable: false,
};

LibraryLayoutBase.propTypes = {
  children: PropTypes.instanceOf(Object).isRequired,
  className: PropTypes.string,
  quickLabelThesaurus: PropTypes.string,
  sidePanelMode: PropTypes.string,
  noScrollable: PropTypes.bool,
};

export { LibraryLayoutBase };

export default connect(state => ({
  quickLabelThesaurus: state.library.sidepanel.quickLabelState.get('thesaurus'),
}))(LibraryLayoutBase);
