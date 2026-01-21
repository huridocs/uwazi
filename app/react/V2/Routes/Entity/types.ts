import { SnippetsSearchResponse } from '#V2/api/types.js';
import { Entity } from '#V2/domain/entities/Entity.js';

type LoaderResponse =
  | { entity: Entity; pagePlaintext?: string; searchResults?: SnippetsSearchResponse }
  | undefined;

export type { LoaderResponse };
