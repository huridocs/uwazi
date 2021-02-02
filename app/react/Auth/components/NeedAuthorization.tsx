import React, { useMemo } from 'react';
import { connect } from 'react-redux';

type PropTypes = {
  authorized: boolean;
  children: React.ReactNode;
  roles?: string[];
  orWriteAccessTo?: any[];
  user: any;
};

const checkWritePermissions = (entities: any[] = [], user?: any) =>
  user
    ? entities.reduce<boolean>((memo, entity) => {
        if (entity.permissions) {
          const idsWithWritePermissions = entity.permissions
            .filter((p: any) => p.level === 'write')
            .map((p: any) => p._id);

          for (let i = 0; i < idsWithWritePermissions.length; i += 1) {
            if (
              idsWithWritePermissions[i] === user.get('_id') ||
              user.groups?.find((g: any) => g._id === idsWithWritePermissions[i])
            ) {
              return memo && true;
            }
          }

          return false;
        }

        return memo && !!entity.write_access;
      }, !!entities.length)
    : false;

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
