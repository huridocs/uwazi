import { UserSchema } from '#shared/types/userType.js';
import { appContext } from '#api/utils/AppContext.js';
import { DataType } from '#api/odm/index.js';
import { permissionsContext } from '#api/permissions/permissionsContext.js';

export const permissionsContext = {
  commandUser: { _id: 'commandId', role: 'editor' },

  getUserInContext: (): DataType<UserSchema> | undefined =>
    <DataType<UserSchema> | undefined>appContext.get('user'),

  permissionsRefIds() {
    const user = this.getUserInContext();
    return [...(user?.groups || []).map(g => g._id.toString()), user?._id?.toString()].filter(
      (v): v is string => !!v
    );
  },

  needsPermissionCheck() {
    const user = this.getUserInContext();
    return !['admin', 'editor'].includes(user?.role || '');
  },

  setCommandContext: () => {
    appContext.set('user', permissionsContext.commandUser);
  },

  setUserInContext(user: UserSchema) {
    appContext.set('user', user);
  },

  setCommandContextAsDefault: () => {
    appContext.setValueAsDefault('user', permissionsContext.commandUser);
  },
};
