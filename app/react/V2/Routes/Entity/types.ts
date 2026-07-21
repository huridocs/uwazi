import { Entity, FileType } from '#V2/api/entities/types.js';
import { SnippetsSearchResponse } from '#V2/api/types.js';

type LoaderResponse =
  | {
      entity?: Entity;
      mainDocument?: FileType;
      pagePlaintext?: string;
      searchResults?: SnippetsSearchResponse;
    }
  | undefined;

export type { LoaderResponse };
