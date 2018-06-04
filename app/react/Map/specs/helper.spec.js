import { getMarkersBoudingBox, markersToStyleFormat } from '../helper';

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

  describe('getMarkersBoudingBox()', () => {
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
});
