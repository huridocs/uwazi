/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

export type ObjectIdSchema =
  | string
  | {
      [k: string]: any | undefined;
    };

export interface LinkSchema {
  label: string;
  url: string;
  [k: string]: any | undefined;
}

export interface DateRangeSchema {
  from?: number | null;
  to?: number | null;
}

export interface LatLonSchema {
  label?: string;
  lat: number;
  lon: number;
  [k: string]: any | undefined;
}

export type GeolocationSchema = {
  label?: string;
  lat: number;
  lon: number;
  [k: string]: any | undefined;
}[];

export type NestedSchema = {
  /**
   * This interface was referenced by `undefined`'s JSON-Schema definition
   * via the `patternProperty` "^(?!lat).*$".
   */
  [k: string]: string[];
}[];

export interface TocSchema {
  range?: {
    start?: number;
    end?: number;
    [k: string]: any | undefined;
  };
  label?: string;
  indentation?: number;
  [k: string]: any | undefined;
}

export interface PropertySchema {
  id?: string;
  label: string;
  name?: string;
  isCommonProperty?: boolean;
  type:
    | 'date'
    | 'daterange'
    | 'geolocation'
    | 'image'
    | 'link'
    | 'markdown'
    | 'media'
    | 'multidate'
    | 'multidaterange'
    | 'multiselect'
    | 'nested'
    | 'numeric'
    | 'preview'
    | 'relationship'
    | 'select'
    | 'text';
  prioritySorting?: boolean;
  content?: string;
  inherit?: boolean;
  inheritProperty?: string;
  filter?: boolean;
  noLabel?: boolean;
  fullWidth?: boolean;
  defaultfilter?: boolean;
  required?: boolean;
  sortable?: boolean;
  showInCard?: boolean;
  style?: string;
  nestedProperties?: string[];
  [k: string]: any | undefined;
}
