import db from 'api/utils/testing_db';
import { search } from 'api/search/search';
import { EntitySchema } from 'shared/types/entityType';

import inheritanceFixtures, { ids } from './fixturesInheritance';
import { fixturesTimeOut } from './fixtures_elastic';

describe('search.searchGeolocations', () => {
  const user = { _id: 'u1' };

  beforeAll(async () => {
    const elasticIndex = 'search.geolocation_index_test';
    await db.clearAllAndLoad(inheritanceFixtures, elasticIndex);
  }, fixturesTimeOut);

  afterAll(async () => {
    await db.disconnect();
  });

  it('should include all geolocation finds, inheriting metadata', async () => {
    const results = await search.searchGeolocations({ order: 'asc', sort: 'sharedId' }, 'en', user);
    expect(results.totalRows).toBe(8);
    expect(results.rows).toMatchObject([
      {
        metadata: {
          work_geolocation: [
            {
              value: {
                lon: 8,
                label: '',
                lat: 23,
              },
            },
          ],
          home_geolocation: [
            {
              value: {
                lon: 7,
                label: '',
                lat: 13,
              },
            },
          ],
        },
        sharedId: 'entity01',
        title: 'Entity with two geolocations en',
      },
      {
        metadata: {
          work_geolocation: [
            {
              value: {
                lon: 444,
                label: '',
                lat: 333,
              },
            },
          ],
          home_geolocation: [
            {
              value: {
                lon: 222,
                label: '',
                lat: 111,
              },
            },
          ],
        },
        sharedId: 'entity02',
        title: 'Entity not always inherited en',
      },
      {
        metadata: {
          home_geolocation: [
            {
              value: {
                lon: 10,
                label: '',
                lat: 5,
              },
            },
          ],
        },
        sharedId: 'entity03',
        title: 'Entity with single geolocation en',
      },
      {
        metadata: {
          country_geolocation: [
            {
              value: {
                lon: 7,
                label: '',
                lat: 23,
              },
            },
          ],
        },
        sharedId: 'entity05',
        title: 'Country A en',
      },
      {
        metadata: {
          inherited_home: [
            {
              label: 'Entity with two geolocations en',
              value: 'entity01',
              inherit_geolocation: [
                {
                  value: {
                    lat: 13,
                    lon: 7,
                    label: '',
                  },
                },
              ],
              inheritedValue: [
                {
                  value: {
                    lat: 13,
                    lon: 7,
                    label: '',
                  },
                },
              ],
              inheritedType: 'geolocation',
            },
            {
              label: 'Entity with single geolocation en',
              value: 'entity03',
              inherit_geolocation: [
                {
                  value: {
                    lat: 5,
                    lon: 10,
                    label: '',
                  },
                },
              ],
              inheritedValue: [
                {
                  value: {
                    lat: 5,
                    lon: 10,
                    label: '',
                  },
                },
              ],
              inheritedType: 'geolocation',
            },
            {
              label: 'Entity without geolocation en',
              value: 'entity04',
              inherit_geolocation: [],
              inheritedValue: [],
              inheritedType: 'geolocation',
            },
            {
              label: 'entity without metadata',
              value: 'entity04.1',
              inherit_geolocation: [],
              inheritedType: 'geolocation',
            },
          ],
          regular_geolocation_geolocation: [
            {
              value: {
                lon: 7,
                lat: 18,
              },
            },
          ],
          inherited_country: [
            {
              label: 'Country A en',
              value: 'entity06',
              inherit_geolocation: [],
              inheritedValue: [{ value: null }],
              inheritedType: 'geolocation',
            },
          ],
        },
        sharedId: 'entity07',
        title: 'Complex inherited entity en',
      },
      {
        metadata: {
          inherited_home: [
            {
              label: 'Entity not always inherited en',
              value: 'entity02',
              inherit_geolocation: [
                {
                  value: {
                    lat: 111,
                    lon: 222,
                    label: '',
                  },
                },
              ],
              inheritedValue: [
                {
                  value: {
                    lat: 111,
                    lon: 222,
                    label: '',
                  },
                },
              ],
              inheritedType: 'geolocation',
            },
            {
              value: 'noExiste',
              inherit_geolocation: [],
              inheritedType: 'geolocation',
            },
          ],
        },
        sharedId: 'entity08',
        title: 'Simple inherited entity en',
      },
      {
        metadata: {
          inherited_work: [
            {
              label: 'Entity with two geolocations en',
              value: 'entity01',
              inherit_geolocation: [
                {
                  value: {
                    lat: 23,
                    lon: 8,
                    label: '',
                  },
                },
              ],
              inheritedValue: [
                {
                  value: {
                    lat: 23,
                    lon: 8,
                    label: '',
                  },
                },
              ],
              inheritedType: 'geolocation',
            },
          ],
        },
        sharedId: 'entity09',
        title: 'Entity with other property inherited en',
      },
      {
        metadata: {
          null_geolocation_geolocation: [],
          inherited_country: [
            {
              label: 'Country A en',
              value: 'entityPrivate01',
              inherit_geolocation: [
                {
                  value: {
                    lat: 24,
                    lon: 8,
                    label: '',
                  },
                },
              ],
              inheritedValue: [
                {
                  value: {
                    lat: 24,
                    lon: 8,
                    label: '',
                  },
                },
              ],
              inheritedType: 'geolocation',
            },
          ],
        },
        sharedId: 'entity_isLinkedToPrivateEntity',
        title: 'Inheriting private country',
      },
    ]);
  });

  it('should allow filtering as in normal search', async () => {
    const results = await search.searchGeolocations(
      { types: [ids.template3], order: 'asc', sort: 'sharedId' },
      'en',
      user
    );
    expect(results.totalRows).toBe(3);
    expect(results.rows).toMatchObject([
      {
        metadata: {
          inherited_home: [
            {
              label: 'Entity with two geolocations en',
              value: 'entity01',
              inherit_geolocation: [
                {
                  value: {
                    lat: 13,
                    lon: 7,
                    label: '',
                  },
                },
              ],
              inheritedValue: [
                {
                  value: {
                    lat: 13,
                    lon: 7,
                    label: '',
                  },
                },
              ],
              inheritedType: 'geolocation',
            },
            {
              label: 'Entity with single geolocation en',
              value: 'entity03',
              inherit_geolocation: [
                {
                  value: {
                    lat: 5,
                    lon: 10,
                    label: '',
                  },
                },
              ],
              inheritedValue: [
                {
                  value: {
                    lat: 5,
                    lon: 10,
                    label: '',
                  },
                },
              ],
              inheritedType: 'geolocation',
            },
            {
              label: 'Entity without geolocation en',
              value: 'entity04',
              inherit_geolocation: [],
              inheritedValue: [],
              inheritedType: 'geolocation',
            },
            {
              label: 'entity without metadata',
              value: 'entity04.1',
              inherit_geolocation: [],
              inheritedType: 'geolocation',
            },
          ],
          regular_geolocation_geolocation: [
            {
              value: {
                lon: 7,
                lat: 18,
              },
            },
          ],
          inherited_country: [
            {
              label: 'Country A en',
              value: 'entity06',
              inherit_geolocation: [],
              inheritedValue: [{ value: null }],
              inheritedType: 'geolocation',
            },
          ],
        },
        sharedId: 'entity07',
        title: 'Complex inherited entity en',
      },
      {
        metadata: {
          inherited_home: [
            {
              label: 'Entity not always inherited en',
              value: 'entity02',
              inherit_geolocation: [
                {
                  value: {
                    lat: 111,
                    lon: 222,
                    label: '',
                  },
                },
              ],
              inheritedValue: [
                {
                  value: {
                    lat: 111,
                    lon: 222,
                    label: '',
                  },
                },
              ],
              inheritedType: 'geolocation',
            },
            {
              value: 'noExiste',
              inherit_geolocation: [],
              inheritedType: 'geolocation',
            },
          ],
        },
        sharedId: 'entity08',
        title: 'Simple inherited entity en',
      },
      {
        metadata: {
          null_geolocation_geolocation: [],
          inherited_country: [
            {
              label: 'Country A en',
              value: 'entityPrivate01',
              inherit_geolocation: [
                {
                  value: {
                    lat: 24,
                    lon: 8,
                    label: '',
                  },
                },
              ],
              inheritedValue: [
                {
                  value: {
                    lat: 24,
                    lon: 8,
                    label: '',
                  },
                },
              ],
              inheritedType: 'geolocation',
            },
          ],
        },
        sharedId: 'entity_isLinkedToPrivateEntity',
        title: 'Inheriting private country',
      },
    ]);
  });

  it('should use inherited and denormalized metadata even if request is not authenticated', async () => {
    const results = await search.searchGeolocations(
      { types: [ids.template3], order: 'asc', sort: 'sharedId' },
      'en'
    );

    const entity = results.rows.find(
      (e: EntitySchema) => e.sharedId === 'entity_isLinkedToPrivateEntity'
    );
    expect(entity).toMatchObject({
      metadata: {
        null_geolocation_geolocation: [],
        inherited_country: [
          {
            label: 'Country A en',
            value: 'entityPrivate01',
            inherit_geolocation: [
              {
                value: {
                  lat: 24,
                  lon: 8,
                  label: '',
                },
              },
            ],
            inheritedValue: [
              {
                value: {
                  lat: 24,
                  lon: 8,
                  label: '',
                },
              },
            ],
            inheritedType: 'geolocation',
          },
        ],
      },
      sharedId: 'entity_isLinkedToPrivateEntity',
      title: 'Inheriting private country',
    });
    expect(results.rows.length).toBe(3);
    expect(results.totalRows).toBe(3);
  });

  it('should return empty results if there are no templates with geolocation fields', async () => {
    const tplWithoutGeolocation = inheritanceFixtures.templates.find(t => t._id === ids.template5);
    await db.clearAllAndLoad({ ...inheritanceFixtures, templates: [tplWithoutGeolocation] });
    const results = await search.searchGeolocations({ order: 'asc', sort: 'sharedId' }, 'en', user);
    expect(results.rows.length).toBe(0);
    expect(results.totalRows).toBe(0);
  });
});
