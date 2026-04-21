import type { EntitySchema } from '#shared/types/entityType.js';

interface Entity extends Omit<
  EntitySchema,
  '_id' | 'sharedId' | 'language' | 'title' | 'template' | 'creationDate' | 'user'
> {
  _id: string;
  sharedId: string;
  language: string;
  title: string;
  template: string;
  creationDate: number;
  user: String;
}

export type { Entity };
