import { UserSchema } from 'shared/types/userType';
import { appContext } from 'api/utils/AppContext';

export function getUserInContext(): UserSchema {
  return appContext.get('user') as UserSchema;
}

export function setCommandContext() {
  appContext.set('user', { _id: 'commandId', role: 'editor' });
}
