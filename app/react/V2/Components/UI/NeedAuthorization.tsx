import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import { PermissionSchema } from 'shared/types/permissionType';
import { EntitySchema } from 'shared/types/entityType';
import { userAtom } from 'V2/atoms';
import { ClientUserSchema } from 'app/apiResponseTypes';

type PropTypes = {
  children: React.ReactNode;
  roles?: string[];
  orWriteAccessTo?: EntitySchema[];
};

const checkWritePermissions = (
  entities: EntitySchema[] = [],
  user: ClientUserSchema | undefined = undefined
) => {
  let granted = user !== undefined && user.role && entities.length > 0;
  let i = 0;
  while (granted && i < entities.length) {
    const entity = entities[i];
    i += 1;
    if (entity && entity.permissions) {
      const idsWithWritePermissions = entity.permissions
        .filter((p: PermissionSchema) => p.level === 'write')
        .map((p: PermissionSchema) => p.refId);

      granted =
        idsWithWritePermissions.find(
          (id: ObjectIdSchema) => id === user?._id || user?.groups?.find(group => group._id === id)
        ) !== undefined;
    } else {
      granted = false;
    }
  }
  return granted;
};

const checkRole = (user?: ClientUserSchema, roles: string[] = ['admin']) =>
  !!(user?._id && roles.includes(user.role));

const NeedAuthorization = ({ children, roles, orWriteAccessTo }: PropTypes) => {
  const user = useAtomValue(userAtom);
  const authorized = useMemo(
    () => checkRole(user, roles) || checkWritePermissions(orWriteAccessTo, user),
    [user, roles, orWriteAccessTo]
  );

  return authorized ? <>{children}</> : null;
};

export { NeedAuthorization };
