/**
 * @jest-environment jsdom
 */
/* eslint-disable react/no-multi-comp */
import React, { useEffect } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ApiError } from '#shared/apiClient/index.js';
import type { Entity } from '#V2/api/entities/types.js';
import { TestAtomStoreProvider, TestRouterContext } from '#V2/testing/index.js';
import { createTestServices } from '#V2/testing/createTestServices.js';
import { ServicesProvider } from '#V2/services/ServicesProvider.js';
import { templatesAtom, userAtom } from '#V2/atoms/index.js';
import {
  EntityScopedProvider,
  useMetadataEditing,
} from '#V2/Routes/Entity/Components/context/index.js';
import { MetadataDisplayFooter } from '#V2/Routes/Entity/Components/metadata/MetadataDisplayFooter.js';
import { MetadataTab } from '../MetadataTab.js';

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

type SessionApi = ReturnType<typeof useMetadataEditing>;

const SessionBridge = ({ onSession }: { onSession: (session: SessionApi) => void }) => {
  const session = useMetadataEditing();
  useEffect(() => {
    onSession(session);
  }, [session, onSession]);
  return null;
};

const HostPair = ({ onSession }: { onSession: (session: SessionApi) => void }) => (
  <>
    <SessionBridge onSession={onSession} />
    <MetadataTab entity={entity} host="side" />
    <MetadataTab entity={entity} host="main" />
    <MetadataDisplayFooter host="side" />
    <MetadataDisplayFooter host="main" />
  </>
);

const renderSession = async (upsert: jest.Mock) => {
  const sessionRef: { current: SessionApi | null } = { current: null };
  const onSession = (session: SessionApi) => {
    sessionRef.current = session;
  };
  const services = createTestServices({ entities: { upsert } });

  render(
    <TestRouterContext loaderData={{ entity, mainDocument: undefined, pagePlaintext: '' }}>
      <ServicesProvider value={services}>
        <TestAtomStoreProvider
          initialValues={[
            [templatesAtom, [{ _id: 't1', name: 'T', properties: [] }]],
            [userAtom, { _id: '1', role: 'admin', name: 'admin' }],
          ]}
        >
          <EntityScopedProvider entity={entity} language="en">
            <HostPair onSession={onSession} />
          </EntityScopedProvider>
        </TestAtomStoreProvider>
      </ServicesProvider>
    </TestRouterContext>
  );

  await waitFor(() => {
    expect(sessionRef.current).not.toBeNull();
  });

  return {
    getSession: () => {
      if (!sessionRef.current) throw new Error('session not ready');
      return sessionRef.current;
    },
  };
};

describe('MetadataTab shared session', () => {
  it('renders MetadataRecord on both side and main hosts when not editing', async () => {
    await renderSession(jest.fn());
    expect(screen.getAllByTestId('metadata-record')).toHaveLength(2);
    expect(screen.queryByTestId('metadata-display')).not.toBeInTheDocument();
  });

  it('does not abort in-flight save when form mount moves to the other host', async () => {
    let resolveUpsert: (value: [Entity, undefined]) => void = () => undefined;
    const upsert = jest.fn(
      async (_input: unknown, _options?: { signal?: AbortSignal }): Promise<[Entity, undefined]> =>
        new Promise(resolve => {
          resolveUpsert = resolve;
        })
    );

    const { getSession } = await renderSession(upsert);

    await act(async () => {
      getSession().registerMetadataActive('side', true);
      getSession().startEditing('side');
    });

    await screen.findByTestId('entity-edit-form');
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(upsert).toHaveBeenCalledTimes(1));
    const saveSignal = upsert.mock.calls[0]?.[1]?.signal;
    expect(saveSignal?.aborted).toBe(false);

    await act(async () => {
      getSession().registerMetadataActive('main', true);
      getSession().startEditing('main');
    });

    expect(saveSignal?.aborted).toBe(false);
    expect(getSession().formMountHost).toBe('main');
    expect(getSession().isSaving).toBe(true);

    await act(async () => {
      resolveUpsert([{ ...entity, title: 'Saved' }, undefined]);
    });

    await waitFor(() => {
      expect(getSession().isEditing).toBe(false);
      expect(getSession().isSaving).toBe(false);
    });
  });

  it('keeps field validation errors on the living host after mount moves', async () => {
    let resolveUpsert: (value: [undefined, ApiError]) => void = () => undefined;
    const upsert = jest.fn(
      async () =>
        new Promise<[undefined, ApiError]>(resolve => {
          resolveUpsert = resolve;
        })
    );

    const { getSession } = await renderSession(upsert);

    await act(async () => {
      getSession().registerMetadataActive('side', true);
      getSession().startEditing('side');
    });

    await screen.findByTestId('entity-edit-form');
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(upsert).toHaveBeenCalledTimes(1));

    await act(async () => {
      getSession().registerMetadataActive('side', false);
      getSession().registerMetadataActive('main', true);
    });
    expect(getSession().formMountHost).toBe('main');

    await act(async () => {
      resolveUpsert([
        undefined,
        new ApiError('Validation failed', {
          kind: 'http',
          status: 400,
          validations: [{ instancePath: '.title', message: 'Title is required' }],
        }),
      ]);
    });

    await waitFor(() => {
      expect(getSession().editErrors?.title).toBe('Title is required');
      expect(screen.getByTestId('entity-edit-form')).toBeInTheDocument();
      expect(screen.getByText('Title is required')).toBeInTheDocument();
    });
  });
});
