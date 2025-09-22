import React from 'react';
import { withRouter } from '../../componentWrappers.js';
import { requestState } from '../../Library/helpers/requestState.js';
import { MapView } from '../../Library/components/MapView.js';
import { LibraryRootComponent } from '../../Library/Library.js';
import LibraryLayout from '../../Library/LibraryLayout.js';
import LibraryModeToggleButtons from '../../Library/components/LibraryModeToggleButtons.js';
import { trackPage } from '../../App/GoogleAnalytics.js';

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
