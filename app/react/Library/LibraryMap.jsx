import React from 'react';
import { withRouter } from '#app/componentWrappers.js';
import { requestState } from '#app/Library/helpers/requestState.js';
import { MapView } from '#app/Library/components/MapView.js';
import { LibraryRootComponent } from '#app/Library/Library.js';
import LibraryLayout from '#app/Library/LibraryLayout.js';
import LibraryModeToggleButtons from '#app/Library/components/LibraryModeToggleButtons.js';
import { trackPage } from '#app/App/GoogleAnalytics.tsx';

class LibraryMapComponent extends LibraryRootComponent {
  static async requestState(requestParams, globalResources) {
    return requestState(requestParams, globalResources, { geolocation: true });
  }

  render() {
    trackPage();
    return (
      <LibraryLayout className="library-map-layout" noindex>
        <LibraryModeToggleButtons mapViewMode />
        <MapView
          storeKey="library"
          ref={ref => {
            this.mapView = ref;
          }}
        />
      </LibraryLayout>
    );
  }
}
const SSRLibraryComponent = withRouter(LibraryMapComponent);

const LibraryMap = Object.assign(SSRLibraryComponent, {
  requestState: LibraryMapComponent.requestState,
});

export { LibraryMapComponent };
export { LibraryMap };
