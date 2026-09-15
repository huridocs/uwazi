/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { userAtom } from '#V2/atoms/index.js';
import { UserRole } from '#shared/types/userSchema.js';
import { AccessLevels, PermissionType } from '#shared/types/permissionSchema.js';
import type { Entity } from '#V2/api/entities/types.js';
import { TestAtomStoreProvider } from '#V2/testing/index.js';
import { EntityProvider } from '../EntityContext.js';
import { EntityWriteAuthorization, useEntityWriteAuthorized } from '../EntityWriteAuthorization.js';

const WriteFlag = () => <span>{useEntityWriteAuthorized() ? 'can-write' : 'no-write'}</span>;

const baseEntity: Entity = {
  _id: 'e1',
  sharedId: 's1',
  title: 'Entity',
  template: 't1',
  language: 'en',
  metadata: {},
  creationDate: 0,
  user: 'user1',
};

const collaborator = {
  _id: 'collab1',
  username: 'collaborator',
  email: 'collaborator@example.com',
  role: UserRole.COLLABORATOR,
  groups: [{ _id: 'groupId', name: 'g1' }],
};

const renderGate = (entity: Entity, user: typeof collaborator | undefined) =>
  render(
    <TestAtomStoreProvider initialValues={[[userAtom, user]]}>
      <EntityProvider entity={entity}>
        <EntityWriteAuthorization>
          <span>write-ui</span>
        </EntityWriteAuthorization>
        <WriteFlag />
      </EntityProvider>
    </TestAtomStoreProvider>
  );

describe('EntityWriteAuthorization', () => {
  it('shows write UI when collaborator has write on the entity', () => {
    renderGate(
      {
        ...baseEntity,
        permissions: [{ refId: 'collab1', level: AccessLevels.WRITE, type: PermissionType.USER }],
      },
      collaborator
    );
    expect(screen.getByText('write-ui')).toBeInTheDocument();
    expect(screen.getByText('can-write')).toBeInTheDocument();
  });

  it('hides write UI when collaborator has only read', () => {
    renderGate(
      {
        ...baseEntity,
        permissions: [{ refId: 'collab1', level: AccessLevels.READ, type: PermissionType.USER }],
      },
      collaborator
    );
    expect(screen.queryByText('write-ui')).not.toBeInTheDocument();
    expect(screen.getByText('no-write')).toBeInTheDocument();
  });

  it('hides write UI when permissions are missing', () => {
    renderGate(baseEntity, collaborator);
    expect(screen.queryByText('write-ui')).not.toBeInTheDocument();
    expect(screen.getByText('no-write')).toBeInTheDocument();
  });
});
