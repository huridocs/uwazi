/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

export interface LabelCountSchema {
  totalRows: number;
  totalLabels: number;
  thesaurus: {
    propertyName: string;
    totalValues: {
      [k: string]: number | undefined;
    };
    [k: string]: unknown | undefined;
  };
}
