import type { Entity } from '#V2/api/entities/types.js';
import type { EntitySaveInput } from '#V2/services/contracts/EntitiesService.js';

type TemplateChoice = {
  _id: string;
  default?: boolean;
};

const defaultLibraryTemplateId = (templates: TemplateChoice[]) =>
  templates.find(template => template.default)?._id ?? templates[0]?._id ?? '';

const blankLibraryEntity = (templateId: string, language: string): Entity => ({
  _id: '',
  sharedId: '',
  title: '',
  template: templateId,
  language,
  creationDate: 0,
  user: '',
});

const omitEmpty = <T extends object>(payload: T, key: keyof T) => {
  if (!payload[key]) {
    delete payload[key];
  }
};

const toNewEntitySaveInput = (input: EntitySaveInput): EntitySaveInput => {
  const payload = { ...input };
  omitEmpty(payload, '_id');
  omitEmpty(payload, 'sharedId');
  omitEmpty(payload, 'user');
  omitEmpty(payload, 'creationDate');
  return payload;
};

export { blankLibraryEntity, defaultLibraryTemplateId, toNewEntitySaveInput };
