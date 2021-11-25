import React from 'react';
import requestState from 'app/Library/helpers/requestState';
import MapView from 'app/Library/components/MapView';
import LibraryLayout from 'app/Library/LibraryLayout';
import Library from 'app/Library/Library';
import LibraryModeToggleButtons from 'app/Library/components/LibraryModeToggleButtons';

export default class LibraryMap extends Library {
  static async requestState(requestParams, globalResources) {
    return requestState(requestParams, globalResources, { mapMarkers: true });
  }

  render() {
    return (
      <LibraryLayout className="library-map-layout">
        <LibraryModeToggleButtons
          storeKey="library"
          zoomIn={() => {
            this.mapView.getWrappedInstance().map.zoomIn();
          }}
          zoomOut={() => {
            this.mapView.getWrappedInstance().map.zoomOut();
          }}
          setMapStyle={style => {
            this.mapView.getWrappedInstance().map.setMapStyle(style);
          }}
          zoomLevel={0}
          mapViewMode
        />
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
