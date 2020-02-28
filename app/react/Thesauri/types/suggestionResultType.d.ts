/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

export interface SuggestionResultSchema {
  totalRows: number;
  totalSuggestions: number;
  thesaurus: {
    propertyName: string;
    totalValues: {
      [k: string]: number | undefined;
    };
    [k: string]: any | undefined;
  };
}
