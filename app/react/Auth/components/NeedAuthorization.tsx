import React from 'react';
import { connect } from 'react-redux';

type PropTypes = {
  authorized: boolean;
  children: React.ReactNode;
};

const NeedAuthorization: React.FC<PropTypes> = ({ authorized, children }: PropTypes) =>
  authorized ? <React.Fragment>{children}</React.Fragment> : null;

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
