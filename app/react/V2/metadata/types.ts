import type { PropertyTypeSchema } from '#shared/types/commonTypes.js';

interface Timelink {
  readonly time: number;
  readonly hh: number;
  readonly mm: number;
  readonly ss: number;
  readonly label: string;
}

type DatePropertyTypes = 'date' | 'multidate' | 'daterange' | 'multidaterange';
type SelectPropertyTypes = 'select' | 'multiselect';
type GeolocationPropertyTypes = 'geolocation';
type RelationshipPropertyTypes = 'relationship';
type FilePropertyTypes = 'image' | 'media';
type DefaultPropertyTypes = 'text' | 'markdown';
type ValuePropertyTypes = 'link' | 'preview';
type NumericPropertyTypes = 'numeric';
type GeneratedIdPropertyTypes = 'generatedid';

type AllowedPropertyTypes =
  | DatePropertyTypes
  | SelectPropertyTypes
  | GeolocationPropertyTypes
  | RelationshipPropertyTypes
  | FilePropertyTypes
  | DefaultPropertyTypes
  | ValuePropertyTypes
  | NumericPropertyTypes
  | GeneratedIdPropertyTypes
  | 'nested'
  | 'newRelationship';

interface BaseMetadataProperty {
  readonly _id: string;
  readonly name: string;
  readonly label: string;
  readonly type: AllowedPropertyTypes;
  readonly propertyGroup?: Array<{
    name: string;
    label: string;
    inhertied?: boolean;
    content?: string;
    property?: string;
  }>;
  readonly inherited?: boolean;
  readonly inheritedType?: PropertyTypeSchema;
  readonly relationShipTarget?: string;
  readonly hideLabel?: boolean;
}

interface SimpleMetadataProperty extends BaseMetadataProperty {
  readonly type: 'text' | 'generatedid' | 'numeric' | 'markdown';
  readonly values: Array<{ value: string }>;
}

interface DateMetadataProperty extends BaseMetadataProperty {
  readonly type: 'date';
  readonly values: Array<{ value: number }>;
}

interface MultiDateMetadataProperty extends Omit<DateMetadataProperty, 'type'> {
  readonly type: 'multidate';
}

interface DateRangeMetadataProperty extends Omit<BaseMetadataProperty, 'values'> {
  readonly type: 'daterange';
  readonly values: Array<{
    value: { from: number; to: number };
  }>;
}

interface MultiDateRangeMetadataProperty extends Omit<DateRangeMetadataProperty, 'type'> {
  readonly type: 'multidaterange';
}
interface GeolocationMetadataProperty extends Omit<BaseMetadataProperty, 'values'> {
  readonly type: 'geolocation';
  readonly values: Array<{
    value: { latitude: number; longitude: number };
    label?: string;
    color?: string;
    entity?: {
      _id: string;
      icon?: { _id: string; label: string };
    };
  }>;
}

interface MediaMetadataProperty extends Omit<BaseMetadataProperty, 'values'> {
  readonly type: 'media';
  readonly values: Array<{
    value: string;
    alt?: string;
    timelinks?: Timelink[];
    mimetype?: string;
    fileType?: string;
  }>;
}

interface ImageMetadataProperty extends Omit<BaseMetadataProperty, 'values'> {
  readonly type: 'image';
  readonly style: 'contain' | 'cover';
  readonly values: Array<{
    value: string;
    alt?: string;
  }>;
}

interface PreviewMetadataProperty extends Omit<BaseMetadataProperty, 'values'> {
  readonly type: 'preview';
  readonly style: 'contain' | 'cover';
  readonly values: Array<{
    value: string;
    alt: string;
  }>;
}

interface SelectMetadataProperty extends Omit<BaseMetadataProperty, 'values'> {
  readonly type: 'select';
  readonly values: Array<{
    value: string;
    label?: string;
    translatedLabel?: string;
    selected?: boolean;
    parent?: {
      label: string;
      translatedLabel?: string;
      value: string;
    };
  }>;
}

interface MultiSelectMetadataProperty extends Omit<SelectMetadataProperty, 'type'> {
  readonly type: 'multiselect';
}

interface LinkMetadataProperty extends Omit<BaseMetadataProperty, 'type'> {
  readonly type: 'link';
  readonly values: Array<{
    value: string;
    label?: string;
  }>;
}

interface RelationshipEntityValue {
  readonly _id: string;
  readonly title: string;
  readonly templateId?: string;
  readonly icon?: { _id: string; label?: string };
}

interface RelatedRelationshipMetadataProperty extends Omit<BaseMetadataProperty, 'values'> {
  readonly type: 'relationship';
  readonly mode: 'related';
  readonly values: RelationshipEntityValue[];
}

interface InheritedRelationshipMetadataProperty extends Omit<BaseMetadataProperty, 'values'> {
  readonly type: 'relationship';
  readonly mode: 'inherited';
  readonly values: MetadataProperty[];
}

type RelationshipMetadataProperty =
  | RelatedRelationshipMetadataProperty
  | InheritedRelationshipMetadataProperty;

type MetadataProperty =
  | SimpleMetadataProperty
  | DateMetadataProperty
  | MultiDateMetadataProperty
  | DateRangeMetadataProperty
  | MultiDateRangeMetadataProperty
  | GeolocationMetadataProperty
  | MediaMetadataProperty
  | ImageMetadataProperty
  | PreviewMetadataProperty
  | SelectMetadataProperty
  | MultiSelectMetadataProperty
  | LinkMetadataProperty
  | RelationshipMetadataProperty;

export type {
  MetadataProperty,
  BaseMetadataProperty,
  SimpleMetadataProperty,
  DateMetadataProperty,
  MultiDateMetadataProperty,
  DateRangeMetadataProperty,
  MultiDateRangeMetadataProperty,
  SelectMetadataProperty,
  MultiSelectMetadataProperty,
  GeolocationMetadataProperty,
  RelationshipMetadataProperty,
  LinkMetadataProperty,
  MediaMetadataProperty,
  Timelink,
  ImageMetadataProperty,
  PreviewMetadataProperty,
};
