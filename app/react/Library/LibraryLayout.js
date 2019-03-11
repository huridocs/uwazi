import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { NeedAuthorization } from 'app/Auth';
import Welcome from 'app/Library/components/Welcome';
import LibraryFilters from 'app/Library/components/LibraryFilters';
import Helmet from 'react-helmet';
import ViewMetadataPanel from 'app/Library/components/ViewMetadataPanel';
import SelectMultiplePanelContainer from 'app/Library/containers/SelectMultiplePanelContainer';
import SemanticSearchPanel from 'app/SemanticSearch/components/SemanticSearchPanel';
import { t } from 'app/I18N';
import blankState from './helpers/blankState';

export default class LibraryLayout extends Component {
  render() {
    if (blankState()) {
      return <Welcome/>;
    }
    const { className, children } = this.props;

    return (
      <div className="row panels-layout">
        <Helmet title={t('System', 'Library', null, false)} />
        <main className={`library-viewer document-viewer with-panel ${className}`}>
          {children}
        </main>
        <LibraryFilters storeKey="library"/>
        <ViewMetadataPanel storeKey="library"/>
        <SelectMultiplePanelContainer storeKey="library"/>
        <NeedAuthorization roles={['admin', 'editor']}>
          <SemanticSearchPanel storeKey="library" />
        </NeedAuthorization>
      </div>
    );
  }
}

LibraryLayout.defaultProps = {
  className: ''
};

LibraryLayout.propTypes = {
  children: PropTypes.instanceOf(Object).isRequired,
  className: PropTypes.string
};
