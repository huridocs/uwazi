import { createStore } from 'jotai';
import type { Entity } from '#V2/api/entities/types.js';
import {
  localeAtom,
  relationshipTypesAtom,
  templatesAtom,
  translationsAtom,
} from '#V2/atoms/index.js';
import { relationshipsPanelEntityAtom } from '#V2/Routes/Entity/Components/RelationshipsPanel/relationshipsPanelDataAtoms.js';
import { apiEntity, templates, translations } from '../fixtures/referencesFixtures.js';

const relationshipStoryTypes = [
  { _id: '6a0c5d0784b3eaec97612923', name: 'related to' },
  { _id: '6a0c5d0084b3eaec97612911', name: 'mentions' },
];

const createRelationshipsStoryStore = (locale: 'en' | 'es', entity: Entity = apiEntity) => {
  const store = createStore();
  store.set(localeAtom, locale);
  store.set(templatesAtom, templates);
  store.set(translationsAtom, translations);
  store.set(relationshipTypesAtom, relationshipStoryTypes);
  store.set(relationshipsPanelEntityAtom, entity);
  return store;
};

export { createRelationshipsStoryStore };
