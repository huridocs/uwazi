/** @format */

import Immutable from 'immutable';

import { getMarkers } from '../helper';

describe('map helper', () => {
  describe('getMarkers()', () => {
    let templates;
    let entities;

    beforeEach(() => {
      templates = Immutable.fromJS([
        {
          _id: 't1',
          properties: [
            { _id: 't1p1', type: 'geolocation', name: 'geoProperty', label: 'geoPropertyLabel' },
            { type: 'geolocation', name: 'secondGeoProperty', label: 'secondGeoPropertyLabel' },
            {
              type: 'relationship',
              name: 'inheritedGeo1',
              label: 'Inherited Property Label 1',
              content: 't2',
              inherit: { property: 't2p1', type: 'geolocation' },
            },
            {
              type: 'relationship',
              name: 'inheritedGeo2',
              label: 'Inherited Property Label 2',
              content: 't4',
              inherit: { property: 't4p2', type: 'geolocation' },
            },
          ],
          color: 'red',
        },
        {
          _id: 't2',
          properties: [
            {
              _id: 't2p1',
              type: 'geolocation',
              name: 'anotherGeoProperty',
              label: 'anotherGeoPropertyLabel',
            },
          ],
          color: 'blue',
        },
        {
          _id: 't3',
          properties: [{ type: 'notGeolocation', name: 'notGeo' }],
          color: 'green',
        },
        {
          _id: 't4',
          properties: [
            {
              _id: 't4p1',
              type: 'relationship',
              name: 'anotherInheritedGeo',
              label: 'Another Inherited Property Label',
              content: 't1',
              inherit: { property: 't1p1', type: 'geolocation' },
            },
            {
              _id: 't4p2',
              type: 'geolocation',
              name: 't4GeoProperty',
              label: 't4GeoPropertyLabel',
            },
          ],
          color: 'yellow',
        },
      ]);

      entities = Immutable.fromJS([
        {
          sharedId: 'e1',
          template: 't1',
          metadata: {
            geoProperty: [
              { value: { lat: 7, lon: 13 } },
              { value: { lat: 13, lon: 7, label: 'home' } },
            ],
            secondGeoProperty: [{ value: { lat: 5, lon: 13 } }],
            text: [{ value: 'text value' }],
          },
        },
        {
          template: 't1',
          metadata: {
            geoProperty: [{ value: { lat: 5, lon: 22 } }],
            secondGeoProperty: [{ value: null }],
          },
        },
        { template: 't3', metadata: { notGeo: [{ value: { lat: 1977, lon: 7 } }] } },
        {
          template: 't2',
          sharedId: 'e4',
          title: 'e4Title',
          metadata: { anotherGeoProperty: [{ value: { lat: 2018, lon: 6 } }] },
        },
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

    describe('Inheritance', () => {
      beforeEach(() => {
        entities = entities
          .setIn(
            [0, 'metadata', 'inheritedGeo1'],
            Immutable.fromJS([
              {
                value: 'e5',
                label: 'e5 Label',
                inherit_geolocation: [{ value: { lat: 23, lon: 1946 } }],
              },
              {
                value: 'e4',
                label: 'e4 Label',
                inherit_geolocation: [
                  { value: { lat: 2018, lon: 6 } },
                  { value: { lat: 1977, lon: 1982, label: 'inherited label' } },
                ],
              },
            ])
          )
          .setIn(
            [0, 'metadata', 'inheritedGeo2'],
            Immutable.fromJS([
              {
                value: 'e5',
                label: 'e5 Label',
                inherit_geolocation: [{ value: { lat: 23, lon: 1946 } }],
              },
            ])
          )
          .push(
            Immutable.fromJS({
              template: 't2',
              sharedId: 'e5',
              metadata: { anotherGeoProperty: [{ value: { lat: 23, lon: 1946 } }] },
            })
          )
          .push(
            Immutable.fromJS({
              template: 't4',
              metadata: {
                anotherInheritedGeo: [
                  {
                    value: 'e1',
                    label: 'e1 Label',
                    inherit_geolocation: [{ value: { lat: 13, lon: 7, label: 'home' } }],
                  },
                ],
              },
            })
          );
      });

      it('should include inherited properties', () => {
        const processedMarkers = getMarkers(entities, templates);
        expect(processedMarkers.length).toBe(11);
        expect(processedMarkers).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ properties: expect.objectContaining({ inherited: true }) }),
          ])
        );
        expect(processedMarkers).toMatchSnapshot();
      });
    });
  });
});
