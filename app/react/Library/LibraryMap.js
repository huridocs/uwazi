import React from 'react';
import requestState from 'app/Library/helpers/requestState';
import MapView from 'app/Library/components/MapView';
import LibraryLayout from 'app/Library/LibraryLayout';
import Library from 'app/Library/Library';
import LibraryModeToggleButtons from 'app/Library/components/LibraryModeToggleButtons';

export default class LibraryMap extends Library {
  static requestState(params, _query = {}, globalResources) {
    return requestState(params, _query, globalResources, 'markers');
  }

  render() {
    return (
      <LibraryLayout className="library-map-layout">
        <LibraryModeToggleButtons
          storeKey="library"
          zoomIn={() => { this.mapView.getWrappedInstance().map.zoomIn(); }}
          zoomOut={() => { this.mapView.getWrappedInstance().map.zoomOut(); }}
          zoomLevel={0}
        />
        <MapView storeKey="library" ref={(ref) => { this.mapView = ref; }}/>
      </LibraryLayout>
    );
  }
}
