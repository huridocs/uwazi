/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emitTypes to update.*/

export type ObjectIdSchema =
  | string
  | {
      [k: string]: any | undefined;
    };

export interface LinkSchema {
  label: string;
  url: string;
}

export interface DateRangeSchema {
  from?: number | null;
  to?: number | null;
}

export interface LatLonSchema {
  label?: string;
  lat: number;
  lon: number;
}

export type GeolocationSchema = LatLonSchema[];

export interface TocSchema {
  range?: {
    start?: number;
    end?: number;
    [k: string]: any | undefined;
  };
  label?: string;
  indentation?: number;
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
