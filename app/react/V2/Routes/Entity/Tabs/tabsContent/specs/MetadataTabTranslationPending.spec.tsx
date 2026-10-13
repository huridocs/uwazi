/** @jest-environment jsdom */
import React, { useEffect } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { Entity } from '#V2/api/entities/types.js';
import { translateText } from '#V2/api/translationService/index.js';
import { settingsAtom, templatesAtom, userAtom } from '#V2/atoms/index.js';
import {
  EntityScopedProvider,
  useMetadataEditing,
} from '#V2/Routes/Entity/Components/context/index.js';
import { MetadataDisplayFooter } from '#V2/Routes/Entity/Components/metadata/MetadataDisplayFooter.js';
import { ServicesProvider } from '#V2/services/ServicesProvider.js';
import { TestAtomStoreProvider, TestRouterContext } from '#V2/testing/index.js';
import { createTestServices } from '#V2/testing/createTestServices.js';
import { MetadataTab } from '../MetadataTab.js';

jest.mock('#V2/api/translationService/index.js', () => ({
  translateText: jest.fn(async () => ['ok', undefined]),
  probeTranslationService: jest.fn(async () => true),
}));

const entity: Entity = {
  _id: 'e1',
  sharedId: 's1',
  title: 'Entity',
  template: 't1',
  language: 'en',
  metadata: {},
  creationDate: 0,
  user: 'user1',
};

type Session = ReturnType<typeof useMetadataEditing>;

const SessionBridge = ({ onSession }: { onSession: (session: Session) => void }) => {
  const session = useMetadataEditing();
  useEffect(() => {
    onSession(session);
  }, [session, onSession]);
  return null;
};

const hangTranslation = () => {
  let release: (value: [string, undefined]) => void = () => undefined;
  jest.mocked(translateText).mockImplementation(
    async () =>
      new Promise(resolve => {
        release = resolve;
      })
  );
  return (value: [string, undefined]) => release(value);
};

const renderEditor = (upsert: jest.Mock, sessionRef: { current: Session | null }) => {
  render(
    <TestRouterContext loaderData={{ entity, mainDocument: undefined, pagePlaintext: '' }}>
      <ServicesProvider value={createTestServices({ entities: { upsert } })}>
        <TestAtomStoreProvider
          initialValues={[
            [templatesAtom, [{ _id: 't1', name: 'T', properties: [] }]],
            [userAtom, { _id: '1', role: 'admin', name: 'admin' }],
            [
              settingsAtom,
              {
                languages: [
                  { key: 'en', label: 'English', default: true },
                  { key: 'es', label: 'Spanish' },
                ],
                features: { translationService: true },
              },
            ],
          ]}
        >
          <EntityScopedProvider entity={entity} language="en">
            <SessionBridge
              onSession={session => {
                sessionRef.current = session;
              }}
            />
            <MetadataTab entity={entity} host="main" />
            <MetadataDisplayFooter host="main" />
          </EntityScopedProvider>
        </TestAtomStoreProvider>
      </ServicesProvider>
    </TestRouterContext>
  );
};

const startEditing = async (sessionRef: { current: Session | null }) => {
  await waitFor(() => {
    expect(sessionRef.current).not.toBeNull();
  });
  await act(async () => {
    sessionRef.current?.registerMetadataActive('main', true);
    sessionRef.current?.startEditing('main');
  });
  await screen.findByTestId('entity-edit-form');
};

const pendingCopy =
  'Some translations are still pending, saving would stop the translation process.';

const startHungTranslation = async (upsert: jest.Mock) => {
  const release = hangTranslation();
  const sessionRef: { current: Session | null } = { current: null };
  renderEditor(upsert, sessionRef);
  await startEditing(sessionRef);
  fireEvent.click(screen.getByRole('button', { name: 'Auto-translate' }));
  expect(await screen.findByText('Translating')).toBeInTheDocument();
  return release;
};

const submitWhilePending = async (upsert: jest.Mock) => {
  fireEvent.submit(screen.getByTestId('entity-edit-form'));
  expect(await screen.findByText(pendingCopy)).toBeInTheDocument();
  expect(upsert).not.toHaveBeenCalled();
};

describe('MetadataTab translation pending', () => {
  it('keeps save and cancel available and asks before stopping a translation', async () => {
    const upsert = jest.fn();
    const release = await startHungTranslation(upsert);
    expect(
      screen.queryByText('Wait for translations to finish before saving or leaving.')
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled();
    await submitWhilePending(upsert);
    fireEvent.click(screen.getByTestId('cancel-button'));
    await waitFor(() => {
      expect(screen.queryByText(pendingCopy)).not.toBeInTheDocument();
    });
    await act(async () => {
      release(['Hola', undefined]);
    });
    expect(await screen.findByDisplayValue('(AI translated) Hola')).toBeInTheDocument();
  });

  it('stops the translation and saves when the confirmation is accepted', async () => {
    const upsert = jest.fn(async () => [entity, undefined]);
    const release = await startHungTranslation(upsert);
    await submitWhilePending(upsert);
    fireEvent.click(screen.getByTestId('accept-button'));
    await waitFor(() => {
      expect(upsert).toHaveBeenCalled();
    });
    await act(async () => {
      release(['(AI translated) Late', undefined]);
    });
    expect(screen.queryByDisplayValue('(AI translated) Late')).not.toBeInTheDocument();
  });
});
