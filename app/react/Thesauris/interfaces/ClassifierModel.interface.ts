/**
 *  Model is the type used for holding information about a classifier model.
 *
 * @format
 */

export interface IClassifierModel {
  name: string;
  preferred?: string;
  bert?: string;
  sample?: number;
  completeness?: number;
  extraneous?: number;
  instances?: Array<string>;
  topics: {
    [key: string]: {
      name: string;
      quality: number;
      samples: number;
    };
  };
}
