import React from 'react';
import { withRouter } from 'app/componentWrappers';
import { requestState } from 'app/Library/helpers/requestState';
import { MapView } from 'app/Library/components/MapView';
import { LibraryRootComponent } from 'app/Library/Library';
import LibraryLayout from 'app/Library/LibraryLayout';
import LibraryModeToggleButtons from 'app/Library/components/LibraryModeToggleButtons';
import { trackPage } from 'app/App/GoogleAnalytics';

class LibraryMapComponent extends LibraryRootComponent {
  static async requestState(requestParams, globalResources) {
    return requestState(requestParams, globalResources, { geolocation: true });
  }

  render() {
    trackPage();
    return (
      <LibraryLayout className="library-map-layout">
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
