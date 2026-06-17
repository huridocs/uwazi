import { Sort } from 'mongodb';
import { FileDBO } from './schemas/filesTypes.js';

type FileProjection<T = FileDBO> = Partial<Record<keyof T, 0 | 1>>;

interface GetFileOptions<T = FileDBO> {
  projection?: FileProjection<T>;
}

interface ListFileOptions<T = FileDBO> extends GetFileOptions<T> {
  sort?: Sort;
  limit?: number;
}

interface EntityFileOptions<T = FileDBO> extends ListFileOptions<T> {
  types?: FileDBO['type'][];
  languages?: string[];
}

export type { GetFileOptions, ListFileOptions, EntityFileOptions, FileProjection };
