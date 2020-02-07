/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

export interface ClassifierModelSchema {
  name: string;
  preferred?: string;
  bert?: string;
  sample?: number;
  completeness?: number;
  extraneous?: number;
  instances?: string[];
  topics: {
    [k: string]:
      | {
          name?: any;
          quality?: any;
          samples?: any;
          [k: string]: any | undefined;
        }
      | undefined;
  };
}
