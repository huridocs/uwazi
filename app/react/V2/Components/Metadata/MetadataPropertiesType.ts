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

interface SourceValue {
  value: string;
  label: string;
  color?: string;
  icon?: string;
  url?: string;
}

interface InheritedPropertyInfo {
  type: AllowedPropertyTypes;
  name: string;
  label: string;
  translatedLabel?: string;
}

interface ExtendedPropertyInfo {
  _id: string;
  template?: {
    _id: string;
    name: string;
    label: string;
    color: string;
  };
  inherited: boolean;
  inheritedProperty?: InheritedPropertyInfo;
  content?: string;
  options?: SelectMetadataProperty['values'];
  hideLabel?: boolean;
  showInCard?: boolean;
  style?: string;
}

interface BaseMetadataProperty {
  readonly _id: string;
  readonly name: string;
  readonly label: string;
  readonly type: AllowedPropertyTypes;
  readonly inherited?: boolean;
  readonly inheritedType?: PropertyTypeSchema;
  // readonly properties?: ExtendedPropertyInfo;
}

interface SimpleMetadataProperty extends BaseMetadataProperty {
  // readonly type: 'text' | 'generatedid' | 'numeric' | 'markdown' | 'preview' | 'nested';
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
    properties?: {
      color?: string;
      entity?: {
        _id: string;
        label: string;
        icon?: string;
        url?: string;
      };
    };
    source?: SourceValue;
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
    source?: SourceValue;
  }>;
}

interface ImageMetadataProperty extends Omit<BaseMetadataProperty, 'values'> {
  readonly type: 'image';
  readonly values: Array<{
    value: string;
    alt?: string;
    source?: SourceValue;
  }>;
}

interface PreviewMetadataProperty extends Omit<BaseMetadataProperty, 'values'> {
  readonly type: 'preview';
  readonly values: Array<{
    value: string;
    alt: string;
    source?: SourceValue;
  }>;
}
interface MarkdownMetadataProperty extends Omit<BaseMetadataProperty, 'values'> {
  readonly type: 'markdown';
  readonly values: Array<{
    value: string;
    label: string;
    source?: SourceValue;
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
    source?: SourceValue;
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
    source?: SourceValue;
  }>;
}

interface PermissionMetadataProperty extends Omit<BaseMetadataProperty, 'values' | 'type'> {
  readonly type: 'permissions';
  readonly values: Array<{
    value: {
      refId: string;
      permissions: Array<{
        type: 'user' | 'group';
        refId: string;
        level: 'read' | 'write' | 'mixed';
      }>;
      isPublic: boolean;
      isRestricted: boolean;
      currentUserAccess: 'read' | 'write' | 'admin' | 'none';
    };
    label?: string;
  }>;
}

interface RelationshipMetadataProperty extends Omit<BaseMetadataProperty, 'values'> {
  readonly type: 'relationship';
  readonly inhertiedValues: MetadataProperty;
  readonly parentEntity: { _id: string; title: string; icon?: string };
  // readonly properties?: ExtendedPropertyInfo;
}

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
  | MarkdownMetadataProperty
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
};
