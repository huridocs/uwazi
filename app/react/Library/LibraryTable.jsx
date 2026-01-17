import React from 'react';
import { TableViewer } from '#app/Layout/TableViewer.js';
import { LibraryRootComponent } from '#app/Library/Library.js';
import LibraryLayout from '#app/Library/LibraryLayout.js';
import DocumentsList from '#app/Library/components/DocumentsList.js';
import { requestState } from '#app/Library/helpers/requestState.js';
import { withRouter } from '#app/componentWrappers.js';
import { trackPage } from '#app/App/GoogleAnalytics.tsx';

class LibraryTableComponent extends LibraryRootComponent {
  static async requestState(requestParams, globalResources) {
    return requestState(requestParams, globalResources, { calculateTableColumns: true });
  }

  render() {
    trackPage();
    return (
      <LibraryLayout sidePanelMode="unpinned-mode" noindex>
        <DocumentsList
          storeKey="library"
          CollectionViewer={TableViewer}
          zoomIn={this.zoomIn}
          zoomOut={this.zoomOut}
          scrollCount={this.state.scrollCount}
          tableViewMode
        />
      </LibraryLayout>
    );
  }
}

const SSRLibraryComponent = withRouter(LibraryTableComponent);

const LibraryTable = Object.assign(SSRLibraryComponent, {
  requestState: LibraryTableComponent.requestState,
});

export { LibraryTableComponent };
export { LibraryTable };
