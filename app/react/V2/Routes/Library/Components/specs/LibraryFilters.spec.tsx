/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import { localeAtom, templatesAtom, translationsAtom, userAtom } from '#V2/atoms/index.js';
import { templates, translations } from '#app/stories/fixtures/referencesFixtures.js';
import type { LibraryAggregations } from '#shared/types/librarySearch.js';
import { LibraryFilters } from '../LibraryFilters.js';

const aggregations: LibraryAggregations = {
  templates: [{ id: 'template1', count: 2 }],
  published: { published: 2, restricted: 1 },
  properties: {
    country: [{ id: 'ES', label: 'Spain', count: 1 }],
  },
};

const renderFilters = (
  onChange = jest.fn(),
  chips: { key: string; label: string; onRemove: () => void }[] = []
) =>
  render(
    <TestAtomStoreProvider
      initialValues={[
        [localeAtom, 'en'],
        [templatesAtom, templates],
        [translationsAtom, translations],
        [userAtom, { _id: 'admin1', role: 'admin', username: 'admin' }],
      ]}
    >
      <LibraryFilters
        aggregations={aggregations}
        filters={{ type: ['template1'] }}
        onChange={onChange}
        chips={chips}
      />
    </TestAtomStoreProvider>
  );

describe('LibraryFilters footer', () => {
  it('collapses and expands facet cards', async () => {
    const user = userEvent.setup();
    renderFilters();

    expect(screen.getByText('Restricted')).toBeInTheDocument();
    expect(screen.getByText('Documents')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Collapse all' }));
    expect(screen.queryByText('Restricted')).not.toBeInTheDocument();
    expect(screen.queryByText('Documents')).not.toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Expand all' }));
    expect(screen.getByText('Restricted')).toBeInTheDocument();
    expect(screen.getByText('Documents')).toBeInTheDocument();
  });

  it('lists applied filters in the active filters sheet', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    const onRemove = jest.fn();
    renderFilters(onChange, [{ key: 'type:template1', label: 'Type: Documents', onRemove }]);

    expect(screen.getByText('Active filters')).toBeInTheDocument();
    expect(screen.getByText('Type: Documents')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear all' }));
    expect(onChange).toHaveBeenCalledWith({});
  });

  it('clears active filters from the footer', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    renderFilters(onChange);

    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onChange).toHaveBeenCalledWith({});
  });
});
