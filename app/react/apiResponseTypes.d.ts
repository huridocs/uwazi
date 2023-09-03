import { UserGroupSchema } from 'shared/types/userGroupType';
import { UserSchema } from 'shared/types/userType';
import {
  PreserveConfig,
  Settings,
  SettingsFilterSchema,
  SettingsLinkSchema,
} from 'shared/types/settingsType';
import { LanguageSchema } from 'shared/types/commonTypes';

export interface GroupMemberSchema {
  refId: string;
  username: string;
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

export interface ClientSettingsFilterSchema extends Omit<SettingsFilterSchema, '_id'> {
  _id?: string;
}

export interface ClientSettingsLinkSchema extends Omit<SettingsLinkSchema, '_id'> {
  _id?: string;
}

export interface ClientPreserveConfig extends Omit<PreserveConfig, 'config'> {
  config: {
    token: string;
    template: string;
    user?: string;
  }[];
}

export interface ClientLanguageSchema extends Omit<LanguageSchema, '_id'> {
  _id?: string;
}

export interface ClientSettings
  extends Omit<Settings, '_id | filters | links | features | languages'> {
  _id?: string;
  filters?: ClientSettingsFilterSchema[];
  languages?: ClientLanguageSchema[];
  links?: ClientSettingsLinkSchema[];
  _rev?: string;
  features?: Omit<Settings['features'], 'preserve | metadataExtraction'> & {
    preserve?: ClientPreserveConfig;
    metadataExtraction?: {
      url: string;
      templates?: {
        template: string;
        properties: string[];
      }[];
    };
    [k: string]: unknown | undefined;
  };
}
