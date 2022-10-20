import { UserGroupSchema } from 'shared/types/userGroupType';
import { UserSchema } from 'shared/types/userType';
import { Settings as SettingsServer } from 'shared/types/settingsType';

export interface GroupMemberSchema {
  refId: string;
}

export interface ClientUserGroupSchema extends Omit<UserGroupSchema, '_id' | 'members'> {
  _id?: string;
  members: GroupMemberSchema[];
}

export interface ClientUserSchema extends Omit<UserSchema, '_id' | 'groups'> {
  _id?: string;
  groups?: {
    _id: string;
    name: string;
  }[];
}

export interface Settings extends Omit<SettingsServer, '_id'> {
  _id?: string;
}
