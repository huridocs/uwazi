/* eslint-disable */
/**AUTO-GENERATED. RUN yarn build_schema to update.*/

export interface TemplateSchema {
  _id?: string;
  name: string;
  color?: string;
  default?: boolean;
  commonProperties: [PropertySchema, ...(PropertySchema)[]];
  properties: PropertySchema[];
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
}

