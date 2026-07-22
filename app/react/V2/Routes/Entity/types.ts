import { Entity, FileType } from '#V2/api/entities/types.js';

type LoaderResponse =
  | {
      entity?: Entity;
      mainDocument?: FileType;
      pagePlaintext?: string;
    }
  | undefined;

export type { LoaderResponse };
