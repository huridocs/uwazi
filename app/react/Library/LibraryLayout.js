import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { store } from 'app/store';
import Welcome from 'app/Library/components/Welcome';
import LibraryFilters from 'app/Library/components/LibraryFilters';
import LibraryModeToggleButtons from 'app/Library/components/LibraryModeToggleButtons';
import Helmet from 'react-helmet';
import ViewMetadataPanel from 'app/Library/components/ViewMetadataPanel';
import SelectMultiplePanelContainer from 'app/Library/containers/SelectMultiplePanelContainer';
import { t } from 'app/I18N';

export default class LibraryLayout extends Component {
  render() {
    const state = store.getState();
    if (!state.templates.size) {
      return <Welcome/>;
    }

    return (
      <div className="row panels-layout">
        <Helmet title={t('System', 'Library')} />
        <main className="library-viewer document-viewer with-panel">
          <LibraryModeToggleButtons storeKey="library"/>
          {this.props.children}
        </main>
        <LibraryFilters storeKey="library"/>
        <ViewMetadataPanel storeKey="library"/>
        <SelectMultiplePanelContainer storeKey="library"/>
      </div>
    );
  }
}

LibraryLayout.propTypes = {
  children: PropTypes.instanceOf(Object).isRequired
};
