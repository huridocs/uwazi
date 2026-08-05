import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { userAtom } from '#V2/atoms/index.js';
import {
  checkRole,
  checkWritePermissions,
  NeedAuthorization,
} from '#V2/Components/UI/NeedAuthorization.js';
import { useEntityScopedEntity } from './EntityContext.js';

const ENTITY_WRITE_ROLES = ['admin', 'editor'] as const;

const useEntityWriteAuthorized = () => {
  const entity = useEntityScopedEntity();
  const user = useAtomValue(userAtom);

  return useMemo(
    () =>
      checkRole(user, [...ENTITY_WRITE_ROLES]) ||
      checkWritePermissions(entity ? [entity] : undefined, user),
    [entity, user]
  );
};

const EntityWriteAuthorization = ({ children }: { children: React.ReactNode }) => {
  const entity = useEntityScopedEntity();

  return (
    <NeedAuthorization
      roles={[...ENTITY_WRITE_ROLES]}
      orWriteAccessTo={entity ? [entity] : undefined}
    >
      {children}
    </NeedAuthorization>
  );
};

export { EntityWriteAuthorization, useEntityWriteAuthorized };
