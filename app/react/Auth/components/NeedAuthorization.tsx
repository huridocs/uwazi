import React, { useMemo } from 'react';
import { connect } from 'react-redux';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import { PermissionSchema } from 'shared/types/permissionType';

type PropTypes = {
  children: React.ReactNode;
  roles?: string[];
  orWriteAccessTo?: any[];
  user: any;
};

const checkWritePermissions = (entities: any[] = [], user?: any) => {
  let granted = user !== undefined && user.has('role') && entities.length > 0;
  let i = 0;
  while (granted && i < entities.length) {
    const entity = entities[i];
    i += 1;
    if (entity.permissions) {
      const idsWithWritePermissions = entity.permissions
        .filter((p: PermissionSchema) => p.level === 'write')
        .map((p: PermissionSchema) => p._id);

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

const checkRole = (roles: string[] = ['admin'], user: any) =>
  !!(user.get('_id') && roles.includes(user.get('role')));

const NeedAuthorization: React.FC<PropTypes> = ({
  children,
  roles,
  orWriteAccessTo,
  user,
}: PropTypes) => {
  const authorized = useMemo(
    () => checkRole(roles, user) || checkWritePermissions(orWriteAccessTo, user),
    [user, roles, orWriteAccessTo]
  );

  return authorized ? <>{children}</> : null;
};

const mapStateToProps = ({ user }: any) => ({ user });

export default connect(mapStateToProps)(NeedAuthorization);
