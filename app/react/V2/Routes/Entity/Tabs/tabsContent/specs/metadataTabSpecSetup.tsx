import React, { useEffect } from 'react';
import { render, waitFor } from '@testing-library/react';
import type { Entity } from '#V2/api/entities/types.js';
import { AccessLevels, PermissionType } from '#shared/types/permissionSchema.js';
import { templatesAtom, userAtom } from '#V2/atoms/index.js';
import { EntityFilesProvider } from '#V2/Routes/Entity/Components/Files/index.js';
import {
  EntityScopedProvider,
  useEntityContext,
  useMetadataEditing,
} from '#V2/Routes/Entity/Components/context/index.js';
import { MetadataDisplayFooter } from '#V2/Routes/Entity/Components/metadata/MetadataDisplayFooter.js';
import { ServicesProvider } from '#V2/services/ServicesProvider.js';
import { TestAtomStoreProvider, TestRouterContext } from '#V2/testing/index.js';
import { createTestServices } from '#V2/testing/createTestServices.js';
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
  relations: [{ entity: 'other', entityData: { title: 'Other', template: 't2' } }],
  permissions: [{ refId: '1', type: PermissionType.USER, level: AccessLevels.WRITE }],
};

type SessionApi = ReturnType<typeof useMetadataEditing>;

const HostPair = ({ onSession }: { onSession: (session: SessionApi) => void }) => {
  const session = useMetadataEditing();
  const { entity: scoped } = useEntityContext();
  useEffect(() => {
    onSession(session);
  }, [onSession, session]);
  return (
    <>
      <span data-testid="rel-entity">{scoped.relations?.[0]?.entity ?? ''}</span>
      <span data-testid="perm-level">{scoped.permissions?.[0]?.level ?? 'none'}</span>
      <MetadataTab entity={entity} host="side" />
      <MetadataTab entity={entity} host="main" />
      <MetadataDisplayFooter host="side" />
      <MetadataDisplayFooter host="main" />
    </>
  );
};

const renderSession = async (
  upsert: jest.Mock,
  getBySharedId: jest.Mock = jest.fn().mockResolvedValue([[entity]])
) => {
  const sessionRef: { current: SessionApi | null } = { current: null };
  const onSession = (session: SessionApi) => {
    sessionRef.current = session;
  };
  const services = createTestServices({ entities: { upsert, getBySharedId } });

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
            <EntityFilesProvider entity={entity}>
              <HostPair onSession={onSession} />
            </EntityFilesProvider>
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

export { entity, renderSession };
