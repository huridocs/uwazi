/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import { ObjectIdSchema } from 'shared/types/commonTypes';

export interface ActivityLogGetRequest {
  query?: {
    user?: ObjectIdSchema;
    username?: string;
    find?: string;
    time?: {
      from?: number;
      to?: number;
      [k: string]: unknown | undefined;
    };
    before?: number;
    limit?: number;
    page?: number;
    method?: string[];
    search?: string;
    sort?: {
      prop: ActivityLogSortProp;
      asc: number;
    };
    url?: string;
    body?: string;
    params?: string;
    query?: string;
  };
  [k: string]: unknown | undefined;
}

export type ActivityLogSortProp = 'method' | 'time' | 'username' | 'url';
