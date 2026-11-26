/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import type { ClientTranslationSchema } from '#app/istore.js';
import type { PropertySchema } from '#shared/types/commonTypes.js';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import { localeAtom, translationsAtom } from '#V2/atoms/index.js';
import { NestedFacet } from '../NestedFacet.js';

const property: PropertySchema = {
  _id: 'prop-articles',
  name: 'violated_articles',
  label: 'Violated articles',
  type: 'nested',
  content: 'th-articles',
};

const spanish: ClientTranslationSchema[] = [
  {
    locale: 'es',
    contexts: [
      {
        id: 'th-articles',
        label: 'Articles',
        values: { Spain: 'España' },
      },
    ],
  },
];

describe('NestedFacet', () => {
  it('shows the instrument name and the translated nested value', () => {
    render(
      <TestAtomStoreProvider
        initialValues={[
          [localeAtom, 'es'],
          [translationsAtom, spanish],
        ]}
      >
        <NestedFacet
          title="Violated articles"
          property={property}
          locale="en"
          defaultExpanded
          selectedByGroup={{}}
          onChangeGroup={() => undefined}
          groups={[
            {
              id: 'daddh',
              label: 'daddh',
              count: 2,
              values: [{ id: 'ES', label: 'Spain', count: 1 }],
            },
          ]}
        />
      </TestAtomStoreProvider>
    );

    expect(
      screen.getByText('American Declaration of the Rights and Duties of Man')
    ).toBeInTheDocument();
    expect(screen.getByText('España')).toBeInTheDocument();
  });
});
