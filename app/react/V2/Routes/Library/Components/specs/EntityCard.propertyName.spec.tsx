/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import type { ClientTranslationSchema } from '#app/istore.js';
import { templates } from '#app/stories/fixtures/referencesFixtures.js';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import { localeAtom, templatesAtom, translationsAtom } from '#V2/atoms/index.js';
import { EntityCard } from '../EntityCard.js';

const spanish: ClientTranslationSchema[] = [
  {
    locale: 'es',
    contexts: [
      {
        id: 'template1',
        label: 'Case',
        values: { Country: 'País', 'Case file': 'Expediente' },
      },
    ],
  },
];

describe('EntityCard property names', () => {
  it('shows the property name in the current language', () => {
    render(
      <MemoryRouter>
        <TestAtomStoreProvider
          initialValues={[
            [localeAtom, 'es'],
            [templatesAtom, templates],
            [translationsAtom, spanish],
          ]}
        >
          <EntityCard
            title="Case file"
            templateId="template1"
            viewHref="/entityv2/abc"
            fields={[{ id: 'country', label: 'Country', value: 'Spain' }]}
          />
        </TestAtomStoreProvider>
      </MemoryRouter>
    );
    expect(screen.getByText('País')).toBeInTheDocument();
    expect(screen.getByText('Case file')).toBeInTheDocument();
    expect(screen.getByText('Spain')).toBeInTheDocument();
  });
});
