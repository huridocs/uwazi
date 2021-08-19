/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

export interface SearchQuery {
  page?: {
    limit?: number;
  };
  filter?: {
    searchString?: string | number;
    sharedId?: string;
    published?: boolean;
    [k: string]:
      | (
          | {
              from?: number;
              to?: number;
            }
          | string
          | number
          | boolean
        )
      | undefined;
  };
  fields?: string[];
}
