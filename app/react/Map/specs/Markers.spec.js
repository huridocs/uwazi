import React from 'react';

import { shallow } from 'enzyme';
import Immutable from 'immutable';

import { mapStateToProps, MarkersComponent } from '../Markers.js';

describe('Markers component', () => {
  const state = {
    templates: Immutable.fromJS([{
      _id: 't1',
      properties: [
        { type: 'geolocation', name: 'geoProperty' },
        { type: 'geolocation', name: 'secondGeoProperty' },
      ]
    }, {
      _id: 't2',
      properties: [
        { type: 'geolocation', name: 'anotherGeoProperty' },
      ]
    }, {
      _id: 't3',
      properties: [
        { type: 'notGeolocation', name: 'notGeo' },
      ]
    }]),
  };

  it('should return parsed markers from entities array', () => {
    const entities = Immutable.fromJS([
      { template: 't1', metadata: { geoProperty: { lat: 7, lon: 13 }, secondGeoProperty: { lat: 5, lon: 13 } } },
      { template: 't1', metadata: { geoProperty: { lat: 5, lon: 22 } } },
      { template: 't3', metadata: { notGeo: { lat: 1977, lon: 7 } } },
      { template: 't2', metadata: { anotherGeoProperty: { lat: 2018, lon: 6 } } },
    ]);

    const props = mapStateToProps(state);
    const resultMarkers = [];

    shallow(
      <MarkersComponent {...props} entities={entities}>
        {markers => markers.map(m => resultMarkers.push(m))}
      </MarkersComponent>
    );

    expect(resultMarkers.length).toBe(4);
    expect(resultMarkers).toMatchSnapshot();
  });

  it('should return an empty array if no data', () => {
    const props = mapStateToProps(state);
    const resultMarkers = [];

    shallow(
      <MarkersComponent {...props}>
        {markers => markers.map(m => resultMarkers.push(m))}
      </MarkersComponent>
    );

    expect(resultMarkers).toEqual([]);
  });
});
