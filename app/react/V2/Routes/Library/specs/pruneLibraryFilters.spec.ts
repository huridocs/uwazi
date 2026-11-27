import type { Template } from '#app/apiResponseTypes.js';
import type { LibraryAggregations } from '#shared/types/librarySearch.js';
import { pruneLibraryFilters, pruneUnavailableFilters } from '../pruneLibraryFilters.js';

const property = (
  name: string,
  flags: { filter: boolean; defaultfilter?: boolean }
): NonNullable<Template['properties']>[number] => ({
  _id: name,
  label: name,
  name,
  type: 'select',
  filter: flags.filter,
  defaultfilter: flags.defaultfilter,
});

const templates: Template[] = [
  {
    _id: 'contracts',
    name: 'Contracts',
    properties: [
      property('contracting', { filter: true }),
      property('country', { filter: true, defaultfilter: true }),
    ],
  },
  {
    _id: 'contractors',
    name: 'Contractors',
    properties: [property('country', { filter: true, defaultfilter: true })],
  },
];

const aggregations = (properties: LibraryAggregations['properties']): LibraryAggregations => ({
  templates: [],
  published: { published: 0, restricted: 0 },
  properties,
});

describe('pruneUnavailableFilters', () => {
  it('drops a select filter that is not shown', () => {
    expect(
      pruneUnavailableFilters({
        filters: { type: ['contractors'], yes_no: ['no'] },
        andFilters: ['yes_no'],
        templates: [
          {
            _id: 'contractors',
            properties: [property('yes_no', { filter: true })],
          },
        ],
        aggregations: aggregations({}),
      })
    ).toEqual({
      filters: { type: ['contractors'] },
      andFilters: [],
    });
  });

  it('keeps a select filter that has results and a text filter', () => {
    expect(
      pruneUnavailableFilters({
        filters: { type: ['contractors'], yes_no: ['no'], title: ['acme'] },
        andFilters: ['yes_no'],
        templates: [
          {
            _id: 'contractors',
            properties: [
              property('yes_no', { filter: true }),
              { ...property('title', { filter: true }), type: 'text' },
            ],
          },
        ],
        aggregations: aggregations({
          yes_no: [{ id: 'no', label: 'No', count: 1 }],
        }),
      })
    ).toEqual({
      filters: { type: ['contractors'], yes_no: ['no'], title: ['acme'] },
      andFilters: ['yes_no'],
    });
  });
});

describe('pruneLibraryFilters', () => {
  it('keeps type, status, and the shared property when Contractors is selected', () => {
    expect(
      pruneLibraryFilters({
        filters: {
          type: ['contractors'],
          status: ['published'],
          contracting: ['services'],
          country: ['ES'],
          'country.groupId': ['eu'],
        },
        andFilters: ['contracting', 'country'],
        templates,
        typeIds: ['contractors'],
      })
    ).toEqual({
      filters: {
        type: ['contractors'],
        status: ['published'],
        country: ['ES'],
        'country.groupId': ['eu'],
      },
      andFilters: ['country'],
    });
  });

  it('drops and filters when no criteria remain', () => {
    expect(
      pruneLibraryFilters({
        filters: {},
        andFilters: ['country'],
        templates,
        typeIds: [],
      })
    ).toEqual({ filters: {}, andFilters: [] });
  });

  it('keeps status and the default property when the type selection is cleared', () => {
    expect(
      pruneLibraryFilters({
        filters: {
          status: ['restricted'],
          contracting: ['services'],
          country: ['ES'],
        },
        andFilters: ['contracting', 'country'],
        templates,
        typeIds: [],
      })
    ).toEqual({
      filters: {
        status: ['restricted'],
        country: ['ES'],
      },
      andFilters: ['country'],
    });
  });
});
