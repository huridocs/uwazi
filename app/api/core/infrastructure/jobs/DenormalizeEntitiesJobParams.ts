import { UwaziJobParams } from './UwaziJobHandler.js';

type DenormalizeThesaurusEntitiesParams = {
  kind: 'thesaurus';
  thesaurusId: string;
  valueIds: string[];
} & UwaziJobParams;

type DenormalizeThesaurusEntitiesChunkParams = {
  kind: 'thesaurus';
  thesaurusId: string;
  sharedIds: string[];
} & UwaziJobParams;

type DenormalizeRelationshipsParams = {
  kind: 'relationships';
  sharedIds: string[];
} & UwaziJobParams;

export type {
  DenormalizeThesaurusEntitiesParams,
  DenormalizeThesaurusEntitiesChunkParams,
  DenormalizeRelationshipsParams,
};
