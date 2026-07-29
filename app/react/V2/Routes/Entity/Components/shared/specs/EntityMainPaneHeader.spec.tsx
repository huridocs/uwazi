/** @jest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { TestAtomStoreProvider } from '#V2/testing/index.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { settingsAtom } from '#V2/atoms/index.js';
import type { Entity } from '#V2/api/entities/types.js';
import { EntityMainPaneHeader } from '../EntityMainPaneHeader';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => children,
  t: (_ctx: string, key: string) => key,
}));

jest.mock('#V2/Routes/Entity/Components/document/index.js', () => ({
  DocumentViewModeSelect: () => <div data-testid="view-mode" />,
}));

const entity: Entity = {
  _id: 'e1',
  sharedId: 's1',
  title: 'Velásquez-Rodríguez v. Honduras',
  template: 'tmpl-case',
  language: 'en',
  creationDate: 1,
  user: 'u1',
};

const renderHeader = () =>
  render(
    <TestAtomStoreProvider
      initialValues={[
        [templatesAtom, [{ _id: 'tmpl-case', name: 'Court Case', color: '#3B82F6' }]],
        [settingsAtom, { languages: [{ key: 'en', label: 'English', default: true }] }],
      ]}
    >
      <EntityMainPaneHeader entity={entity} />
    </TestAtomStoreProvider>
  );

describe('EntityMainPaneHeader', () => {
  it('shows the entity title under the type tag', () => {
    renderHeader();

    const typeTag = screen.getByText('Court Case');
    const title = screen.getByRole('heading', { name: entity.title });
    expect(title).toBeInTheDocument();
    expect(typeTag.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
  });
});
