import { UserSchema } from 'shared/types/userType';
import { appContext } from 'api/utils/AppContext';

export const permissionsContext = {
  getUserInContext: (): UserSchema | undefined => <UserSchema | undefined>appContext.get('user'),

  setCommandContext: () => {
    appContext.set('user', { _id: 'commandId', role: 'editor' });
  },
};
