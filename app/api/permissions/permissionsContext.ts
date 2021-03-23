import { UserSchema } from 'shared/types/userType';
import { appContext } from 'api/utils/AppContext';

export const permissionsContext = {
  getUserInContext: (): UserSchema | undefined => <UserSchema | undefined>appContext.get('user'),

  permissionsRefIds() {
    const user = this.getUserInContext();
    return [...(user?.groups || []).map(g => g._id.toString()), user?._id];
  },

  setCommandContext: () => {
    appContext.set('user', { _id: 'commandId', role: 'editor' });
  },
};
