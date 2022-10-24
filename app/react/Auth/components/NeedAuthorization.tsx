import React, { useMemo } from 'react';
import { connect } from 'react-redux';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import { PermissionSchema } from 'shared/types/permissionType';
import { EntitySchema } from 'shared/types/entityType';
import { ClientUserSchema } from 'app/apiResponseTypes';

type PropTypes = {
  children: React.ReactNode;
  roles?: string[];
  orWriteAccessTo?: EntitySchema[];
  user: ClientUserSchema;
};

const checkWritePermissions = (
  entities: EntitySchema[] = [],
  user: any | undefined = undefined
) => {
  let granted = user !== undefined && user.has('role') && entities.length > 0;
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
          (id: ObjectIdSchema) =>
            id === user.get('_id') || user.get('groups')?.find((g: any) => g.get('_id') === id)
        ) !== undefined;
    } else {
      granted = false;
    }
  }
  return granted;
};

const checkRole = (user: any | undefined, roles: string[] = ['admin']) =>
  !!(user.get('_id') && roles.includes(user.get('role')));

const NeedAuthorization: React.FC<PropTypes> = ({
  children,
  roles,
  orWriteAccessTo,
  user,
}: PropTypes) => {
  const authorized = useMemo(
    () => checkRole(user, roles) || checkWritePermissions(orWriteAccessTo, user),
    [user, roles, orWriteAccessTo]
  );

  return authorized ? <>{children}</> : null;
};

const mapStateToProps = ({ user }: any) => ({ user });

export default connect(mapStateToProps)(NeedAuthorization);
