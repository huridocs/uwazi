import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Helmet } from 'react-helmet';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { t } from '#app/I18N/index.js';
import { resetFilters as resetFiltersAction } from '#app/Library/actions/filterActions.js';
import { hideFilters as hideFiltersAction } from '#app/Entities/actions/uiActions.js';
import { wrapDispatch } from '#app/Multireducer/index.js';
import { LibraryFiltersConnected } from '#app/Library/components/LibraryFilters.js';
import { ViewMetadataPanel } from '#app/Library/components/ViewMetadataPanel.js';
import { SelectMultiplePanelContainer } from '#app/Library/containers/SelectMultiplePanelContainer.js';
import { LibraryFooter } from './components/LibraryFooter.js';

class LibraryLayoutBase extends Component {
  render() {
    const {
      className,
      children,
      quickLabelThesaurus,
      sidePanelMode,
      scrollCallback,
      scrollCount,
      noindex,
      resetFilters,
      hideFilters,
    } = this.props;
    const contentDivClass = `${
      quickLabelThesaurus ? 'with-header ' : ''
    } content-holder library-viewer document-viewer with-footer with-panel ${sidePanelMode} ]`;

    return (
      <div className="row panels-layout" data-testid="library-content">
        <Helmet>
          <title>{t('System', 'Library', null, false)}</title>
          {noindex && <meta name="robots" content="noindex" />}
        </Helmet>
        <div className={contentDivClass} onScroll={scrollCallback}>
          <main className={`${className}`}>{children}</main>
          <LibraryFooter storeKey="library" scrollCount={scrollCount} />
          <LibraryFiltersConnected
            storeKey="library"
            sidePanelMode={sidePanelMode}
            resetFilters={resetFilters}
            hideFilters={hideFilters}
          />
          {!quickLabelThesaurus && <ViewMetadataPanel storeKey="library" />}
          {!quickLabelThesaurus && <SelectMultiplePanelContainer storeKey="library" />}
        </div>
      </div>
    );
  }
}

LibraryLayoutBase.defaultProps = {
  className: '',
  quickLabelThesaurus: '',
  sidePanelMode: '',
  scrollCallback: () => {},
  scrollCount: 0,
  noindex: false,
};

LibraryLayoutBase.propTypes = {
  children: PropTypes.instanceOf(Object).isRequired,
  className: PropTypes.string,
  quickLabelThesaurus: PropTypes.string,
  sidePanelMode: PropTypes.string,
  scrollCallback: PropTypes.instanceOf(Function),
  scrollCount: PropTypes.number,
  noindex: PropTypes.bool,
  resetFilters: PropTypes.func,
  hideFilters: PropTypes.func,
};

const mapStateToProps = (state, { noindex }) => {
  const { filters } = state.library.search;
  const _noindex = (filters && Object.keys(filters).length > 0) || noindex;
  return {
    quickLabelThesaurus: state.library.sidepanel.quickLabelState.get('thesaurus'),
    noindex: _noindex,
  };
};

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    { resetFilters: resetFiltersAction, hideFilters: hideFiltersAction },
    wrapDispatch(dispatch, 'library')
  );

const LibraryLayout = connect(mapStateToProps, mapDispatchToProps)(LibraryLayoutBase);

export { LibraryLayoutBase, LibraryLayout };
