import { UserSchema } from 'shared/types/userType';
import { appContext } from 'api/utils/AppContext';

export const permissionsContext = {
  getUserInContext: (): UserSchema => appContext.get('user') as UserSchema,

  setCommandContext: () => {
    appContext.set('user', { _id: 'commandId', role: 'editor' });
  },
};
