import Immutable from 'immutable';

import {
  getMarkersBoudingBox,
  markersToStyleFormat,
  getMarkers,
} from '../helper';

describe('map helper', () => {
  const markers = [
    { latitude: 2, longitude: 32 },
    { latitude: 23, longitude: 21 },
    { latitude: 7, longitude: 11 },
    { latitude: 22, longitude: -21 }
  ];

  describe('getMarkersBoudingBox()', () => {
    it('should parse all the markers and return the bounding box for them', () => {
      expect(getMarkersBoudingBox(markers)).toEqual([[-21, 2], [32, 23]]);
    });
  });

  describe('markersToStyleFormat()', () => {
    it('should parse all the markers and return the bounding box for them', () => {
      const expectedFormat = [
        { geometry: { coordinates: [32, 2], type: 'Point' }, properties: { index: 0 }, type: 'Feature' },
        { geometry: { coordinates: [21, 23], type: 'Point' }, properties: { index: 1 }, type: 'Feature' },
        { geometry: { coordinates: [11, 7], type: 'Point' }, properties: { index: 2 }, type: 'Feature' },
        { geometry: { coordinates: [-21, 22], type: 'Point' }, properties: { index: 3 }, type: 'Feature' }
      ];
      expect(markersToStyleFormat(markers)).toEqual(expectedFormat);
    });
  });

  describe('getMarkers()', () => {
    let templates;
    let entities;

    beforeEach(() => {
      templates = Immutable.fromJS([{
        _id: 't1',
        properties: [
          { type: 'geolocation', name: 'geoProperty', label: 'geoPropertyLabel' },
          { type: 'geolocation', name: 'secondGeoProperty', label: 'secondGeoPropertyLabel' },
        ]
      }, {
        _id: 't2',
        properties: [
          { type: 'geolocation', name: 'anotherGeoProperty', label: 'anotherGeoPropertyLabel' },
        ]
      }, {
        _id: 't3',
        properties: [
          { type: 'notGeolocation', name: 'notGeo' },
        ]
      }]);

      entities = Immutable.fromJS([
        { template: 't1',
          metadata: {
            geoProperty: [{ lat: 7, lon: 13 }, { lat: 13, lon: 7, label: 'home' }],
            secondGeoProperty: [{ lat: 5, lon: 13 }]
          }
        },
        { template: 't1', metadata: { geoProperty: [{ lat: 5, lon: 22 }], secondGeoProperty: null } },
        { template: 't3', metadata: { notGeo: [{ lat: 1977, lon: 7 }] } },
        { template: 't2', metadata: { anotherGeoProperty: [{ lat: 2018, lon: 6 }] } },
        { template: 't3' },
        { template: 't2' },
      ]);
    });

    it('should calculate the entity markers based on template data', () => {
      const processedMarkers = getMarkers(entities, templates);
      expect(processedMarkers.length).toBe(5);
      expect(processedMarkers).toMatchSnapshot();
    });

    it('should return an empty array if no data', () => {
      const processedMarkers = getMarkers(Immutable.fromJS([]), templates);
      expect(processedMarkers).toEqual([]);
    });
  });
});
