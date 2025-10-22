import { EntitySchema } from 'shared/types/entityType';

type SearchResponse<T> = {
  data: T[];
  links?: {
    self: string;
    first?: string | null;
    last?: string | null;
    next?: string | null;
    prev?: string | null;
  };
};

type Response<T> = {
  rows: SearchResponse<T>['data'];
  count: number;
};

type EntitySearchResponse = SearchResponse<
  Required<Pick<EntitySchema, 'title' | 'sharedId' | 'template'>> & { _id: string }
>;
type EntityResponse = Response<
  Required<Pick<EntitySchema, 'title' | 'sharedId' | 'template'>> & { _id: string }
>;

export type { SearchResponse, Response, EntitySearchResponse, EntityResponse };
