import React from 'react';
import { LibraryRootComponent } from 'app/Library/Library';
import LibraryLayout from 'app/Library/LibraryLayout';
import DocumentsList from 'app/Library/components/DocumentsList';
import { withRouter } from 'app/componentWrappers';
import { trackPage } from 'app/App/GoogleAnalytics';
import { requestState } from 'app/Library/helpers/requestState';

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
        <DocumentsList
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
