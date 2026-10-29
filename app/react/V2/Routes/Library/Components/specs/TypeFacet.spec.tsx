/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import { settingsAtom, templatesAtom, translationsAtom, userAtom } from '#V2/atoms/index.js';
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

const editor = { _id: 'editor1', role: 'editor', username: 'editor', email: 'e@b.c' };

const renderTypeFacet = ({
  onChange = jest.fn(),
  typeIds = ['template1'],
  settings = {},
  user,
}: {
  onChange?: jest.Mock;
  typeIds?: string[];
  settings?: ClientSettings;
  user?: typeof editor;
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
        ...(user ? [[userAtom, user]] : []),
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

  it('lets an editor switch from featured filters to every template', async () => {
    const user = userEvent.setup();
    renderTypeFacet({
      user: editor,
      typeIds: [],
      settings: { filters: [{ id: 'template1', name: 'Documents' }] },
    });

    expect(screen.getByRole('button', { name: 'FEATURED', pressed: true })).toBeInTheDocument();
    expect(screen.queryByText('Person')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'ALL' }));
    expect(screen.getByRole('button', { name: 'ALL', pressed: true })).toBeInTheDocument();
    expect(screen.getByText('Person')).toBeInTheDocument();
    expect(screen.getByText('Country')).toBeInTheDocument();
  });

  it('opens on all templates when the selection is outside the configured filters', () => {
    renderTypeFacet({
      user: editor,
      typeIds: ['template3'],
      settings: { filters: [{ id: 'template1', name: 'Documents' }] },
    });

    expect(screen.getByRole('button', { name: 'ALL', pressed: true })).toBeInTheDocument();
    expect(screen.getByText('Country')).toBeInTheDocument();
  });

  it('drops types outside the configured filters when switching back to featured', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    renderTypeFacet({
      onChange,
      user: editor,
      typeIds: ['template1', 'template3'],
      settings: { filters: [{ id: 'template1', name: 'Documents' }] },
    });

    await user.click(screen.getByRole('button', { name: 'FEATURED' }));
    expect(onChange).toHaveBeenCalledWith({ type: ['template1'] });
  });

  it('selects every child template when the group is checked', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    renderTypeFacet({ onChange, typeIds: [], settings: { filters: [legalGroup] } });

    await user.click(screen.getByText('Legal'));
    expect(onChange).toHaveBeenCalledWith({ type: ['template1', 'template2'] });
  });
});
