/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { templates, translations } from '#app/stories/fixtures/referencesFixtures.js';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import { localeAtom, templatesAtom, translationsAtom } from '#V2/atoms/index.js';
import { EntityCard } from '../EntityCard.js';

describe('EntityCard link property', () => {
  it('renders an external anchor and does not select the card', () => {
    const onSelect = jest.fn();
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
            viewHref="/entityv2/abc"
            onSelect={onSelect}
            fields={[
              {
                id: 'website',
                label: 'Link',
                value: 'google',
                links: [{ label: 'google', href: 'https://google.com' }],
              },
            ]}
          />
        </TestAtomStoreProvider>
      </MemoryRouter>
    );
    const link = screen.getByRole('link', { name: 'google' });
    expect(link).toHaveAttribute('href', 'https://google.com');
    expect(link).toHaveAttribute('target', '_blank');
    fireEvent.click(link);
    expect(onSelect).not.toHaveBeenCalled();
  });
});
