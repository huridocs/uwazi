import { UserSchema } from 'shared/types/userType';
import { appContext } from 'api/utils/AppContext';

export const permissionsContext = {
  getUserInContext: (): UserSchema | undefined => <UserSchema | undefined>appContext.get('user'),

  permissionsRefIds() {
    const user = this.getUserInContext();
    const permissionTargetIds = user?.groups ? user.groups.map(group => group._id.toString()) : [];
    if (user?._id) {
      permissionTargetIds.push(user._id.toString());
    }
    return permissionTargetIds;
  },

  setCommandContext: () => {
    appContext.set('user', { _id: 'commandId', role: 'editor' });
  },
};
