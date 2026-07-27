/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ApiError } from '#shared/apiClient/index.js';
import type { ClientFile } from '#app/istore.js';
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

const pendingFile = (fileLocalID: string): ClientFile => ({
  _id: fileLocalID,
  fileLocalID,
  originalname: `${fileLocalID}.png`,
  filename: `${fileLocalID}.png`,
  type: 'attachment',
  serializedFile: 'data:image/png;base64,aW1hZ2U=',
  mimetype: 'image/png',
  entity: 's1',
});

type SessionApi = ReturnType<typeof useMetadataEditing>;

const SessionBridge = ({ sessionRef }: { sessionRef: { current: SessionApi | null } }) => {
  sessionRef.current = useMetadataEditing();
  return null;
};

const HostPair = ({ sessionRef }: { sessionRef: { current: SessionApi | null } }) => (
  <>
    <SessionBridge sessionRef={sessionRef} />
    <MetadataTab entity={entity} host="side" />
    <MetadataTab entity={entity} host="main" />
    <MetadataDisplayFooter host="side" />
    <MetadataDisplayFooter host="main" />
  </>
);

const renderSession = (upsert: jest.Mock) => {
  const sessionRef: { current: SessionApi | null } = { current: null };
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
            <HostPair sessionRef={sessionRef} />
          </EntityScopedProvider>
        </TestAtomStoreProvider>
      </ServicesProvider>
    </TestRouterContext>
  );

  const getSession = () => {
    if (!sessionRef.current) throw new Error('session not ready');
    return sessionRef.current;
  };

  return { getSession };
};

describe('MetadataTab shared session', () => {
  it('does not abort in-flight save when formMountHost moves', async () => {
    let resolveUpsert: (value: [Entity, undefined]) => void = () => undefined;
    const upsert = jest.fn(
      async () =>
        new Promise<[Entity, undefined]>(resolve => {
          resolveUpsert = resolve;
        })
    );

    const { getSession } = renderSession(upsert);

    await act(async () => {
      getSession().registerMetadataActive('side', true);
      getSession().startEditing('side');
    });

    await screen.findByTestId('entity-edit-form');
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(upsert).toHaveBeenCalledTimes(1));
    const signal = upsert.mock.calls[0]?.[1]?.signal as AbortSignal;
    expect(signal.aborted).toBe(false);

    await act(async () => {
      getSession().registerMetadataActive('main', true);
      getSession().startEditing('main');
    });

    expect(signal.aborted).toBe(false);
    expect(getSession().formMountHost).toBe('main');

    await act(async () => {
      resolveUpsert([{ ...entity, title: 'Saved' }, undefined]);
    });

    await waitFor(() => {
      expect(getSession().isEditing).toBe(false);
      expect(getSession().isSaving).toBe(false);
    });
  });

  it('keeps pending media when the editor remounts on the other host', async () => {
    const upsert = jest.fn(async (): Promise<[Entity, undefined]> => [entity, undefined]);
    const { getSession } = renderSession(upsert);

    await act(async () => {
      getSession().registerMetadataActive('side', true);
      getSession().startEditing('side');
      getSession().mediaUpload.registerPendingAttachment(pendingFile('local1'));
    });
    expect(getSession().mediaUpload.pendingAttachments).toHaveLength(1);

    await act(async () => {
      getSession().registerMetadataActive('side', false);
      getSession().registerMetadataActive('main', true);
    });

    await waitFor(() => {
      expect(getSession().formMountHost).toBe('main');
      expect(screen.getByTestId('entity-edit-form')).toBeInTheDocument();
    });
    expect(getSession().mediaUpload.pendingAttachments).toHaveLength(1);
    expect(getSession().mediaUpload.pendingAttachments[0]?.fileLocalID).toBe('local1');
  });

  it('keeps field validation errors on the living host after mount moves', async () => {
    let resolveUpsert: (value: [undefined, ApiError]) => void = () => undefined;
    const upsert = jest.fn(
      async () =>
        new Promise<[undefined, ApiError]>(resolve => {
          resolveUpsert = resolve;
        })
    );

    const { getSession } = renderSession(upsert);

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
