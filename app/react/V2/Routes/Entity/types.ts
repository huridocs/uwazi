import { SnippetsSearchResponse } from 'V2/api/types';
import { Entity } from 'V2/domain/entities/Entity';

type LoaderResponse =
  | { entity: Entity; pagePlaintext?: string; searchResults?: SnippetsSearchResponse }
  | undefined;

export type { LoaderResponse };
