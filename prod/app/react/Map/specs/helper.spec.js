"use strict";var _immutable = _interopRequireDefault(require("immutable"));

var _helper = require("../helper");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}





describe('map helper', () => {
  const markers = [
  { latitude: 2, longitude: 32 },
  { latitude: 23, longitude: 21 },
  { latitude: 7, longitude: 11 },
  { latitude: 22, longitude: -21 }];


  describe('getMarkersBoudingBox()', () => {
    it('should parse all the markers and return the bounding box for them', () => {
      expect((0, _helper.getMarkersBoudingBox)(markers)).toEqual([[-21, 2], [32, 23]]);
    });
  });

  describe('markersToStyleFormat()', () => {
    it('should parse all the markers and return the bounding box for them', () => {
      const expectedFormat = [
      { geometry: { coordinates: [32, 2], type: 'Point' }, properties: { index: 0 }, type: 'Feature' },
      { geometry: { coordinates: [21, 23], type: 'Point' }, properties: { index: 1 }, type: 'Feature' },
      { geometry: { coordinates: [11, 7], type: 'Point' }, properties: { index: 2 }, type: 'Feature' },
      { geometry: { coordinates: [-21, 22], type: 'Point' }, properties: { index: 3 }, type: 'Feature' }];

      expect((0, _helper.markersToStyleFormat)(markers)).toEqual(expectedFormat);
    });
  });

  describe('getMarkers()', () => {
    let templates;
    let entities;

    beforeEach(() => {
      templates = _immutable.default.fromJS([{
        _id: 't1',
        properties: [
        { _id: 't1p1', type: 'geolocation', name: 'geoProperty', label: 'geoPropertyLabel' },
        { type: 'geolocation', name: 'secondGeoProperty', label: 'secondGeoPropertyLabel' },
        { type: 'relationship', name: 'inheritedGeo1', label: 'Inherited Property Label 1', content: 't2', inheritProperty: 't2p1' },
        { type: 'relationship', name: 'inheritedGeo2', label: 'Inherited Property Label 2', content: 't4', inheritProperty: 't4p2' }] },

      {
        _id: 't2',
        properties: [
        { _id: 't2p1', type: 'geolocation', name: 'anotherGeoProperty', label: 'anotherGeoPropertyLabel' }] },

      {
        _id: 't3',
        properties: [
        { type: 'notGeolocation', name: 'notGeo' }] },

      {
        _id: 't4',
        properties: [
        { _id: 't4p1',
          type: 'relationship',
          name: 'anotherInheritedGeo',
          label: 'Another Inherited Property Label',
          content: 't1',
          inheritProperty: 't1p1' },

        { _id: 't4p2', type: 'geolocation', name: 't4GeoProperty', label: 't4GeoPropertyLabel' }] }]);



      entities = _immutable.default.fromJS([
      { sharedId: 'e1',
        template: 't1',
        metadata: {
          geoProperty: [{ lat: 7, lon: 13 }, { lat: 13, lon: 7, label: 'home' }],
          secondGeoProperty: [{ lat: 5, lon: 13 }],
          text: 'text value' } },


      { template: 't1', metadata: { geoProperty: [{ lat: 5, lon: 22 }], secondGeoProperty: null } },
      { template: 't3', metadata: { notGeo: [{ lat: 1977, lon: 7 }] } },
      { template: 't2', sharedId: 'e4', title: 'e4Title', metadata: { anotherGeoProperty: [{ lat: 2018, lon: 6 }] } },
      { template: 't3' },
      { template: 't2' }]);

    });

    it('should calculate the entity markers based on template data', () => {
      const processedMarkers = (0, _helper.getMarkers)(entities, templates);
      expect(processedMarkers.length).toBe(5);
      expect(processedMarkers).toMatchSnapshot();
    });

    it('should return an empty array if no data', () => {
      const processedMarkers = (0, _helper.getMarkers)(_immutable.default.fromJS([]), templates);
      expect(processedMarkers).toEqual([]);
    });

    describe('Inheritance', () => {
      beforeEach(() => {
        entities = entities.
        setIn([0, 'metadata', 'inheritedGeo1'], _immutable.default.fromJS([
        { entity: 'e5', inherit_geolocation: [{ lat: 23, lon: 1946 }] },
        { entity: 'e4', inherit_geolocation: [{ lat: 2018, lon: 6 }, { lat: 1977, lon: 1982, label: 'inherited label' }] }])).

        setIn([0, 'metadata', 'inheritedGeo2'], _immutable.default.fromJS([
        { entity: 'e5', inherit_geolocation: [{ lat: 23, lon: 1946 }] }])).

        push(_immutable.default.fromJS(
        { template: 't2', sharedId: 'e5', metadata: { anotherGeoProperty: [{ lat: 23, lon: 1946 }] } })).

        push(_immutable.default.fromJS(
        { template: 't4', metadata: { anotherInheritedGeo: [{ entity: 'e1', inherit_geolocation: [{ lat: 13, lon: 7, label: 'home' }] }] } }));

      });

      it('should include inherited properties', () => {
        const processedMarkers = (0, _helper.getMarkers)(entities, templates);
        expect(processedMarkers.length).toBe(11);
        expect(processedMarkers).toMatchSnapshot();
      });
    });
  });
});