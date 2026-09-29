/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import { settingsAtom, templatesAtom, translationsAtom } from '#V2/atoms/index.js';
import { templates, translations } from '#app/stories/fixtures/referencesFixtures.js';
import type { LibraryAggregations } from '#shared/types/librarySearch.js';
import type { ClientSettings } from '#app/apiResponseTypes.js';
import { TypeFacet } from '../TypeFacet.js';

const aggregations: LibraryAggregations = {
  templates: [
    { id: 'template1', count: 2 },
    { id: 'template2', count: 7 },
  ],
  published: { published: 2, restricted: 1 },
  properties: {},
};

const legalGroup = {
  id: 'group-legal',
  name: 'Legal',
  items: [
    { id: 'template1', name: 'Documents' },
    { id: 'template2', name: 'Person' },
  ],
};

const renderTypeFacet = ({
  onChange = jest.fn(),
  typeIds = ['template1'],
  settings = {},
}: {
  onChange?: jest.Mock;
  typeIds?: string[];
  settings?: ClientSettings;
} = {}) => {
  const setFilter = (key: string, values: string[]) => {
    onChange(values.length ? { [key]: values } : {});
  };
  return render(
    <TestAtomStoreProvider
      initialValues={[
        [templatesAtom, templates],
        [translationsAtom, translations],
        [settingsAtom, settings],
      ]}
    >
      <TypeFacet aggregations={aggregations} typeIds={typeIds} setFilter={setFilter} open />
    </TestAtomStoreProvider>
  );
};

describe('TypeFacet', () => {
  it('lists only the types configured in settings.filters', () => {
    renderTypeFacet({ settings: { filters: [{ id: 'template1', name: 'Documents' }] } });

    expect(screen.getByText('Documents')).toBeInTheDocument();
    expect(screen.queryByText('Person')).not.toBeInTheDocument();
    expect(screen.queryByText('FEATURED')).not.toBeInTheDocument();
    expect(screen.queryByText('ALL')).not.toBeInTheDocument();
  });

  it('lists a configured group with the sum of child counts', () => {
    renderTypeFacet({ typeIds: [], settings: { filters: [legalGroup] } });

    expect(screen.getByText('Legal')).toBeInTheDocument();
    expect(screen.queryByText('Documents')).not.toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
  });

  it('reveals grouped templates when expanded', async () => {
    const user = userEvent.setup();
    renderTypeFacet({ typeIds: [], settings: { filters: [legalGroup] } });

    await user.click(screen.getByRole('button', { name: 'Expand' }));
    expect(screen.getByText('Documents')).toBeInTheDocument();
    expect(screen.getByText('Person')).toBeInTheDocument();
  });

  it('selects every child template when the group is checked', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    renderTypeFacet({ onChange, typeIds: [], settings: { filters: [legalGroup] } });

    await user.click(screen.getByText('Legal'));
    expect(onChange).toHaveBeenCalledWith({ type: ['template1', 'template2'] });
  });
});
