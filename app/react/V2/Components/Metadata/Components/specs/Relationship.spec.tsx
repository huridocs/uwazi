/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { TestAtomStoreProvider } from '#V2/testing/index.js';
import { relationshipTypesAtom } from '#V2/atoms/relationshipTypes.js';
import type { ClientProperty } from '#V2/shared/types.js';
import { RelationshipCards } from '../RelationshipCards.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  t: (_context: string, key: string) => key,
  I18NLinkV2: ({ children, ...props }: { children: React.ReactNode; to: string }) => (
    <a href={props.to}>{children}</a>
  ),
}));

const contractor: ClientProperty = {
  _id: 'contractor',
  name: 'contractor',
  type: 'relationship',
  label: 'Contractor',
  content: 'org',
  relationType: 'rel-people',
};

describe('link-only relationships', () => {
  it('wraps values as chips instead of a card per value', () => {
    render(
      <TestAtomStoreProvider
        initialValues={[[relationshipTypesAtom, [{ _id: 'rel-people', name: 'People' }]]]}
      >
        <RelationshipCards
          fields={[
            {
              _id: 'contractor',
              name: 'contractor',
              label: 'Contractor',
              type: 'relationship',
              mode: 'related',
              values: [
                { _id: 'a', title: 'Ada', templateId: 'org' },
                { _id: 'b', title: 'Bea', templateId: 'org' },
              ],
            },
          ]}
          translationContext="case"
          templatePropertyById={new Map([['contractor', contractor]])}
        />
      </TestAtomStoreProvider>
    );

    expect(screen.queryByTestId('connection-card-stack')).not.toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByRole('list')).toHaveClass('gap-1.5');
    expect(screen.getByText('Ada')).toBeInTheDocument();
  });
});
