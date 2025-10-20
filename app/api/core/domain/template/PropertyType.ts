export enum PropertyTypeEnum {
  Date = 'date',
  DateRange = 'daterange',
  Geolocation = 'geolocation',
  Image = 'image',
  Link = 'link',
  Markdown = 'markdown',
  Media = 'media',
  MultiDate = 'multidate',
  MultiDateRange = 'multidaterange',
  MultiSelect = 'multiselect',
  Nested = 'nested',
  Numeric = 'numeric',
  Preview = 'preview',
  Relationship = 'relationship',
  Select = 'select',
  Text = 'text',
  GeneratedId = 'generatedid',
  NewRelationship = 'newRelationship',
}

export type PropertyType =
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
  | 'text'
  | 'generatedid'
  | 'newRelationship';
