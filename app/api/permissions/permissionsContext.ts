import { UserSchema } from '../../shared/types/userType';

export function getUserInContext(): UserSchema {
  return {
    _id: '5ffe111f3ab2080e1a80dd60',
    username: 'col',
    role: 'collaborator',
    email: 'col@example.com',
    groups: [],
  };
}
