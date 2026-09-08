/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import { localeAtom, templatesAtom, translationsAtom } from '#V2/atoms/index.js';
import { templates, translations } from '#app/stories/fixtures/referencesFixtures.js';
import { EntityCard } from '../EntityCard.js';

const renderCard = (layout: 'cards' | 'list', selected = false) =>
  render(
    <MemoryRouter>
      <TestAtomStoreProvider
        initialValues={[
          [localeAtom, 'en'],
          [templatesAtom, templates],
          [translationsAtom, translations],
        ]}
      >
        <EntityCard
          title="Case file"
          templateId="template1"
          fields={[{ id: 'country', label: 'Country', value: 'Spain' }]}
          layout={layout}
          selected={selected}
          viewHref="/entityv2/abc"
        />
      </TestAtomStoreProvider>
    </MemoryRouter>
  );

describe('EntityCard', () => {
  it('renders title, metadata and view link in cards layout', () => {
    renderCard('cards');
    expect(screen.getByText('Case file')).toBeInTheDocument();
    expect(screen.getByText('Country')).toBeInTheDocument();
    expect(screen.getByText('Spain')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View' })).toHaveAttribute('href', '/en/entityv2/abc');
  });

  it('renders list layout with a compact metadata snippet', () => {
    renderCard('list', true);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/Country:/)).toBeInTheDocument();
  });
});
