import { UserSchema } from 'shared/types/userType';
import { appContext } from 'api/utils/AppContext';

export function getUserInContext(): UserSchema {
  const user = appContext.get('user') as UserSchema;
  return user;
}
