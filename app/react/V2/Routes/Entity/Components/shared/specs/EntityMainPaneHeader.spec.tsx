/**
 * @jest-environment jsdom
 */
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
  it('stacks quiet type tag above the entity title', () => {
    const { container } = renderHeader();

    const strip = container.firstElementChild;
    expect(strip).toHaveClass(
      'flex',
      'shrink-0',
      'items-center',
      'gap-2',
      'min-h-11',
      'pt-1',
      'pb-2',
      'px-3',
      'border-b',
      'border-border'
    );
    expect(screen.getByText('Court Case')).toBeInTheDocument();
    const title = screen.getByRole('heading', { level: 2, name: entity.title });
    expect(title).toBeInTheDocument();
    expect(title).toHaveClass('mt-1');
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
  });
});
