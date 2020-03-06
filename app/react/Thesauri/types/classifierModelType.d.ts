/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

export interface ClassifierModelSchema {
  name: string;
  preferred?: string;
  config?: {
    bert: string;
    num_train?: number;
    num_test?: number;
    [k: string]: any | undefined;
  };
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
