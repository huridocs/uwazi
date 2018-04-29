import React from 'react';
import requestState from 'app/Library/helpers/requestState';
import MapView from 'app/Library/components/MapView';
import LibraryLayout from 'app/Library/LibraryLayout';
import Library from 'app/Library/Library';

export default class LibraryMap extends Library {
  static requestState(params, _query = {}, globalResources) {
    return requestState(params, _query, globalResources, 'markers');
  }

  render() {
    return (
      <LibraryLayout>
        <MapView storeKey="library"/>
      </LibraryLayout>
    );
  }
}
