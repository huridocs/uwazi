/** @format */
import { actions } from 'app/BasicReducer';

export interface enable2faType {
  type: string;
  key: any;
  value: any;
}

export function enable2fa(): enable2faType {
  return actions.setIn('auth/user', 'using2fa', true);
}
