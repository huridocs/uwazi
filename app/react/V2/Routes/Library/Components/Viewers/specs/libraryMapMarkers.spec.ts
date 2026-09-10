import type { Template } from '#app/apiResponseTypes.js';
import type { LibrarySearchHit } from '#shared/types/librarySearch.js';
import { libraryMapMarkers } from '../libraryMapMarkers.js';

const templates = [
  {
    _id: 't1',
    name: 'Places',
    color: 'red',
    properties: [
      { _id: 't1p1', type: 'geolocation', name: 'geoProperty', label: 'Location' },
      {
        _id: 't1p2',
        type: 'relationship',
        name: 'inheritedGeo',
        label: 'Inherited location',
        content: 't2',
        inherit: { property: 't2p1', type: 'geolocation' },
      },
    ],
  },
  {
    _id: 't2',
    name: 'Cities',
    color: 'blue',
    properties: [
      { _id: 't2p1', type: 'geolocation', name: 'anotherGeoProperty', label: 'City location' },
    ],
  },
  {
    _id: 't3',
    name: 'Notes',
    color: 'green',
    properties: [{ _id: 't3p1', type: 'text', name: 'notGeo', label: 'Note' }],
  },
] as Template[];

const rows: LibrarySearchHit[] = [
  {
    _id: '1',
    sharedId: 'e1',
    language: 'en',
    title: 'Place one',
    template: 't1',
    metadata: {
      geoProperty: [{ value: { lat: 7, lon: 13 } }, { value: { lat: 13, lon: 7, label: 'home' } }],
      inheritedGeo: [
        {
          value: 'e2',
          label: 'City two',
          inherit_geolocation: [{ value: { lat: 23, lon: 1946 } }],
        },
      ],
    },
  },
  {
    _id: '2',
    sharedId: 'e2',
    language: 'en',
    title: 'City two',
    template: 't2',
    metadata: { anotherGeoProperty: [{ value: { lat: 2018, lon: 6 } }] },
  },
  {
    _id: '3',
    sharedId: 'e3',
    language: 'en',
    title: 'Note without geo',
    template: 't3',
    metadata: { notGeo: [{ value: 'nope' }] },
  },
];

describe('libraryMapMarkers', () => {
  it('extracts own and inherited geolocation markers from library hits', () => {
    const markers = libraryMapMarkers(rows, templates);

    expect(markers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          latitude: 7,
          longitude: 13,
          label: 'Location',
          properties: expect.objectContaining({
            color: 'red',
            entity: expect.objectContaining({ sharedId: 'e1' }),
          }),
        }),
        expect.objectContaining({
          latitude: 13,
          longitude: 7,
          properties: expect.objectContaining({
            info: 'home',
            entity: expect.objectContaining({ sharedId: 'e1' }),
          }),
        }),
        expect.objectContaining({
          latitude: 23,
          longitude: 1946,
          properties: expect.objectContaining({
            inherited: true,
            entity: expect.objectContaining({ sharedId: 'e1' }),
          }),
        }),
        expect.objectContaining({
          latitude: 2018,
          longitude: 6,
          properties: expect.objectContaining({
            color: 'blue',
            entity: expect.objectContaining({ sharedId: 'e2' }),
          }),
        }),
      ])
    );
    expect(markers.find(marker => marker.properties.entity?.sharedId === 'e3')).toBeUndefined();
  });

  it('returns no markers when there are no rows', () => {
    expect(libraryMapMarkers([], templates)).toEqual([]);
  });
});
