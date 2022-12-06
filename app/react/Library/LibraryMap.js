import React from 'react';
import { requestState } from 'app/Library/helpers/requestState';
import { MapView } from 'app/Library/components/MapView';
import LibraryLayout from 'app/Library/LibraryLayout';
import Library from 'app/Library/Library';
import LibraryModeToggleButtons from 'app/Library/components/LibraryModeToggleButtons';
import { withRouter } from 'app/componentWrappers';

class LibraryMapComponent extends Library {
  static async requestState(requestParams, globalResources) {
    return requestState(requestParams, globalResources, { geolocation: true });
  }

  render() {
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

export { LibraryMap };
