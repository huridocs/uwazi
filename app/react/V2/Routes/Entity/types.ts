import { Entity, FileType } from '#V2/api/entities/types.js';
import type { RelationshipQueryPayload } from '#V2/api/relationships/types.js';
import type { EntityPageViewData } from './Components/EntityPageView/types.js';

type LoaderResponse =
  | {
      entity?: Entity;
      mainDocument?: FileType;
      pagePlaintext?: string;
      entityPageView?: EntityPageViewData;
      relationshipQuery?: RelationshipQueryPayload;
    }
  | undefined;

export type { LoaderResponse };
