import { ObjectId } from 'mongodb';

export interface EntityDBO {
  _id: ObjectId;
  sharedId: string;
  language: string;
  template: ObjectId;
  title: string;
  icon?: { label: string; type: string };
  metadata: Record<string, { value: string; label: string }[]>;
  obsoleteMetadata: string[];
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
