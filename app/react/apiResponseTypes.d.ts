import { UserGroupSchema } from 'shared/types/userGroupType';
import { UserSchema } from 'shared/types/userType';
import {
  PreserveConfig,
  Settings,
  SettingsFilterSchema,
  SettingsLinkSchema,
} from 'shared/types/settingsType';
import { LanguageSchema } from 'shared/types/commonTypes';
import { ThesaurusSchema, ThesaurusValueSchema } from 'shared/types/thesaurusType';
import { TemplateSchema } from 'shared/types/templateType';
import { thesaurusValueSchema } from 'shared/types/thesaurusSchema';

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

export interface ClientSublink extends Omit<ClientSettingsLinkSchema, 'sublinks'> {}

export interface ClientSettingsLinkSchema extends Omit<SettingsLinkSchema, '_id' | 'sublinks'> {
  _id?: string;
  sublinks?: ClientSublink[];
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

export interface Template extends TemplateSchema, Omit<TemplateSchema, '_id'> {
  _id: string;
}

export interface ClientSettings
  extends Omit<Settings, '_id | filters | links | features | languages'> {
  _id?: string;
  filters?: ClientSettingsFilterSchema[];
  languages?: ClientLanguageSchema[];
  links?: ClientSettingsLinkSchema[];
  features?: Omit<Settings['features'], 'preserve | metadataExtraction'> & {
    preserve?: ClientPreserveConfig;
    ocr?: { url: string };
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

export interface ClientThesaurus extends ThesaurusSchema, Omit<ThesaurusSchema, '_id'> {
  _id: string;
  templates: Template[];
  disableRowSelection: boolean;
}

export interface LocalThesaurusValueSchema
  extends ThesaurusValueSchema,
    Omit<thesaurusValueSchema, '_id'> {
  _id?: string;
  id?: string;
  label: string;
  values?: {
    id?: string;
    _id?: string;
    label: string;
    name?: string;
    groupId?: string;
  }[];
}

export interface ClientRelationshipType {
  _id: string;
  name: string;
}
