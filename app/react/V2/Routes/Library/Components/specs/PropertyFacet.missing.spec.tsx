/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ClientTranslationSchema } from '#app/istore.js';
import type { LibraryAggregations, LibraryFacetBucket } from '#shared/types/librarySearch.js';
import type { PropertySchema } from '#shared/types/commonTypes.js';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import { localeAtom, translationsAtom } from '#V2/atoms/index.js';
import { PropertyFacet } from '../PropertyFacet.js';

const spanish: ClientTranslationSchema[] = [
  {
    locale: 'es',
    contexts: [
      {
        id: 'System',
        label: 'System',
        values: { 'No Label': 'Sin etiqueta' },
      },
    ],
  },
];

const country: PropertySchema = {
  _id: 'prop-country',
  name: 'country',
  label: 'Country',
  type: 'select',
  content: 'th-countries',
};

const articles: PropertySchema = {
  _id: 'prop-articles',
  name: 'violated_articles',
  label: 'Violated articles',
  type: 'nested',
  content: 'th-articles',
};

const aggregationsFor = (name: string, buckets: LibraryFacetBucket[]): LibraryAggregations => ({
  templates: [],
  published: { published: 0, restricted: 0 },
  properties: { [name]: buckets },
});

const renderProperty = (
  property: PropertySchema,
  buckets: LibraryFacetBucket[],
  typeIds: string[]
) =>
  render(
    <TestAtomStoreProvider
      initialValues={[
        [localeAtom, 'es'],
        [translationsAtom, spanish],
      ]}
    >
      <PropertyFacet
        property={property}
        templates={[
          {
            _id: 'tpl-case',
            name: 'Case',
            properties: [property],
          },
        ]}
        aggregations={aggregationsFor(property.name, buckets)}
        filters={{}}
        setFilter={() => undefined}
        locale="es"
        typeIds={typeIds}
        andFilters={[]}
        onAndFiltersChange={() => undefined}
      />
    </TestAtomStoreProvider>
  );

const nestedBuckets: LibraryFacetBucket[] = [
  {
    id: 'daddh',
    label: 'daddh',
    count: 3,
    values: [
      { id: 'ES', label: 'Spain', count: 1 },
      { id: 'missing', label: 'No label', count: 2 },
    ],
  },
  { id: 'missing', label: 'No label', count: 1 },
];

describe('PropertyFacet missing bucket', () => {
  const countryBuckets: LibraryFacetBucket[] = [
    { id: 'ES', label: 'Spain', count: 1 },
    { id: 'missing', label: 'No label', count: 2 },
  ];

  it('hides the missing bucket when no type is selected', () => {
    renderProperty(country, countryBuckets, []);
    expect(screen.getByText('Spain')).toBeInTheDocument();
    expect(screen.queryByText('Sin etiqueta')).not.toBeInTheDocument();
    expect(screen.queryByText('No label')).not.toBeInTheDocument();
  });

  it('shows the System No Label when a type is selected', () => {
    renderProperty(country, countryBuckets, ['tpl-case']);
    expect(screen.getByText('Sin etiqueta')).toBeInTheDocument();
    expect(screen.queryByText('No label')).not.toBeInTheDocument();
  });

  it('hides nested missing children when no type is selected', async () => {
    const user = userEvent.setup();
    renderProperty(articles, nestedBuckets, []);
    await user.click(screen.getByRole('button', { name: 'Expand' }));
    expect(screen.getByText('Spain')).toBeInTheDocument();
    expect(screen.queryByText('Sin etiqueta')).not.toBeInTheDocument();
    expect(screen.queryByText('No label')).not.toBeInTheDocument();
  });

  it('shows nested missing children when a type is selected', async () => {
    const user = userEvent.setup();
    renderProperty(articles, nestedBuckets, ['tpl-case']);
    await user.click(screen.getByRole('button', { name: 'Expand' }));
    expect(screen.getAllByText('Sin etiqueta')).toHaveLength(2);
    expect(screen.queryByText('No label')).not.toBeInTheDocument();
    expect(screen.queryByText('missing')).not.toBeInTheDocument();
  });
});
