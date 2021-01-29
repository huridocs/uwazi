import React from 'react';
import { connect } from 'react-redux';

type PropTypes = {
  authorized: boolean;
  children: React.ReactNode;
  write?: any[];
};

const checkWritePermissions = (entities: any[]) =>
  entities.reduce((memo, entity) => memo && entity.write_access, true);

const NeedAuthorization: React.FC<PropTypes> = ({ authorized, children, write }: PropTypes) =>
  authorized || (write && checkWritePermissions(write)) ? <>{children}</> : null;

type mapStateProps = {
  roles: string[];
};

export function mapStateToProps({ user }: any, props: mapStateProps) {
  const roles = props.roles || ['admin'];
  return {
    authorized: !!(user.get('_id') && roles.includes(user.get('role'))),
  };
}

export default connect(mapStateToProps)(NeedAuthorization);
export { NeedAuthorization };
