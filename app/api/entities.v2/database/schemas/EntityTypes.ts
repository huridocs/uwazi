import { TemplateDBO } from '#api/core/infrastructure/mongodb/template/DBOs/TemplateDBO.js';
import { ObjectId } from 'mongodb';
import { PermissionSchema } from '#shared/types/permissionType.js';

type IconDBO = {
  _id: string | null;
  label?: string;
  type: string;
};

export interface EntityDBO {
  _id: ObjectId;
  sharedId: string;
  language: string; // Todo: should be LanguageISO6391
  template: ObjectId;
  title: string;
  icon?: IconDBO;
  metadata: Record<string, { value: string | number; label?: string }[]>;
  obsoleteMetadata: string[];
  user?: ObjectId;
  published: boolean;
  creationDate: number;
  editDate: number;

  mongoLanguage?: string; // Todo: needs to be mapped and implemented
  generatedToc?: boolean; // Todo: needs to be mapped and implemented
  permissions?: PermissionSchema[];
  __v?: number;
}

export interface EntityJoinTemplate extends EntityDBO {
  joinedTemplate: {
    properties: { name: string; type: string; query: any; denormalizedProperty?: string }[];
  }[];
}

export type MultiLanguageEntityDBO = {
  sharedId: string;
  translations: {
    [language: string]: EntityDBO;
  };
  template: string;
};

export type EntityTemplateAggregation = {
  template: TemplateDBO;
  entities: EntityDBO[];
};
