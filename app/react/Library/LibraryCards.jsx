import React from 'react';
import { LibraryRootComponent } from '#app/Library/Library.js';
import { LibraryLayout } from '#app/Library/LibraryLayout.js';
import { LibraryDocumentsList } from '#app/Library/components/DocumentsList.js';
import { withRouter } from '#app/componentWrappers.js';
import { trackPage } from '#app/App/GoogleAnalytics.js';
import { requestState } from '#app/Library/helpers/requestState.js';

class LibraryCardsComponent extends LibraryRootComponent {
  static async requestState(requestParams, globalResources) {
    return requestState(requestParams, globalResources);
  }

  render() {
    trackPage();
    return (
      <LibraryLayout
        sidePanelMode={this.props.sidePanelMode}
        scrollCallback={this.scrollCallback}
        scrollCount={this.state.scrollCount}
      >
        <LibraryDocumentsList
          storeKey="library"
          CollectionViewer={this.props.viewer}
          zoomIn={this.zoomIn}
          zoomOut={this.zoomOut}
          scrollCount={this.state.scrollCount}
        />
      </LibraryLayout>
    );
  }
}

const SSRLibraryComponent = withRouter(LibraryCardsComponent);

const LibraryCards = Object.assign(SSRLibraryComponent, {
  requestState: LibraryCardsComponent.requestState,
});

export { LibraryCardsComponent };
export { LibraryCards };
