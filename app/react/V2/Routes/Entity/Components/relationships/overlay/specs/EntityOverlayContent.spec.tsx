/** @jest-environment jsdom */
/* eslint-disable react/no-multi-comp, class-methods-use-this */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestAtomStoreProvider } from '#V2/testing/index.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { settingsAtom } from '#V2/atoms/settingsAtom.js';
import type { Entity } from '#V2/api/entities/types.js';
import { EntityProvider, useEntityContext } from '../../../context/EntityContext.js';
import { EntityOverlayProvider, useEntityOverlay } from '../../../context/EntityOverlayContext.js';
import { EntityOverlayContent } from '../EntityOverlayContent.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => children,
  I18NLinkV2: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  t: (_ctx: string, key: string) => key,
}));

global.ResizeObserver = class ResizeObserverMock {
  observe() {
    return this;
  }

  unobserve() {
    return this;
  }

  disconnect() {
    return this;
  }
} as unknown as typeof ResizeObserver;

const templates = [
  {
    _id: 'person-tmpl',
    name: 'Person',
    color: '#111',
    properties: [
      { _id: 'gender-prop', type: 'select' as const, label: 'Gender', name: 'gender' },
      {
        _id: 'city-prop',
        type: 'relationship' as const,
        label: 'City',
        name: 'city',
        content: 'city-tmpl',
      },
    ],
  },
  { _id: 'city-tmpl', name: 'City', color: '#FFD54F', properties: [] },
];

const overlayEntity: Entity = {
  _id: 'person-1',
  sharedId: 'person-1',
  language: 'en',
  template: 'person-tmpl',
  title: 'Person 1',
  creationDate: 1,
  user: 'user1',
  documents: [],
  attachments: [],
  metadata: {
    gender: [{ value: 'm', label: 'Male' }],
    city: [{ value: 'quito', label: 'Quito', type: 'entity' }],
  },
};

const hostEntity: Entity = {
  ...overlayEntity,
  _id: 'host',
  sharedId: 'host',
  title: 'Host document',
  metadata: {},
};

const HostTitle = () => {
  const { entity } = useEntityContext();
  return <div data-testid="host-title">{entity.title}</div>;
};

const OverlayTarget = () => {
  const { target } = useEntityOverlay();
  return <div data-testid="overlay-target">{target?.sharedId ?? ''}</div>;
};

const renderContent = () =>
  render(
    <TestAtomStoreProvider
      initialValues={[
        [templatesAtom, templates],
        [settingsAtom, { features: {} }],
      ]}
    >
      <EntityProvider entity={hostEntity}>
        <EntityOverlayProvider>
          <HostTitle />
          <OverlayTarget />
          <EntityOverlayContent entity={overlayEntity} />
        </EntityOverlayProvider>
      </EntityProvider>
    </TestAtomStoreProvider>
  );

describe('EntityOverlayContent', () => {
  it('renders the standard metadata record for the overlay entity', () => {
    renderContent();
    expect(screen.getByTestId('metadata-record')).toBeVisible();
    expect(screen.getByText('Male')).toBeVisible();
    expect(screen.queryByText('in this document')).toBeNull();
    expect(screen.queryByText('Properties')).toBeNull();
  });

  it('replaces the overlay target when a related entity is opened', async () => {
    const user = userEvent.setup();
    renderContent();
    await user.click(screen.getByRole('button', { name: 'Quito' }));
    expect(screen.getByTestId('overlay-target')).toHaveTextContent('quito');
    expect(screen.getByTestId('host-title')).toHaveTextContent('Host document');
  });
});
