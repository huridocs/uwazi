import { ClientThesaurusValue } from 'app/apiResponseTypes';
import { PropertyValueSchema } from 'shared/types/commonTypes';
import { EntitySchema } from 'shared/types/entityType';

export interface Timelink {
  readonly time: number;
  readonly hh: number;
  readonly mm: number;
  readonly ss: number;
  readonly label: string;
}

export interface EntityPermissions {
  readonly canRead: boolean;
  readonly canWrite: boolean;
  readonly canDelete: boolean;
  readonly canShare: boolean;
  readonly userPermissions: string[];
  readonly groupPermissions: string[];
  readonly publicAccess: boolean;
}

export type DatePropertyTypes = 'date' | 'multidate' | 'daterange' | 'multidaterange';
export type SelectPropertyTypes = 'select' | 'multiselect';
export type GeolocationPropertyTypes = 'geolocation';
export type RelationshipPropertyTypes = 'relationship';
export type FilePropertyTypes = 'image' | 'media';
export type DefaultPropertyTypes = 'text' | 'markdown' | 'preview';
export type LinkPropertyTypes = 'link';
export type NumericPropertyTypes = 'numeric';
export type GeneratedIdPropertyTypes = 'generatedid';
export type PermissionPropertyTypes = 'permissions';

export type AllowedPropertyTypes =
  | DatePropertyTypes
  | SelectPropertyTypes
  | GeolocationPropertyTypes
  | RelationshipPropertyTypes
  | FilePropertyTypes
  | DefaultPropertyTypes
  | LinkPropertyTypes
  | NumericPropertyTypes
  | GeneratedIdPropertyTypes
  // | PermissionPropertyTypes
  | 'nested'
  | 'newRelationship';

export interface SourceValue {
  entityId: string;
  value: string;
  label: string;
}

export interface ExtendedPropertyInfo {
  _id: string;
  template?: {
    _id: string;
    name: string;
    label: string;
    color: string;
  };
  inheritedProperty?: {
    property: string;
    type: AllowedPropertyTypes;
    name: string;
    label: string;
  };
  content?: string;
  inherited: boolean;
  translatedLabel?: string;
  options?: SelectMetadataProperty['values'];
}

export interface BaseMetadataProperty {
  readonly _id: string;
  readonly name: string;
  readonly label?: string | null;
  readonly translatedLabel?: string;
  readonly inherited?: boolean;
  readonly inheritedType?: string;
  readonly type: AllowedPropertyTypes;
  readonly properties: ExtendedPropertyInfo;
  readonly values: Array<{
    value: PropertyValueSchema;
    label?: string;
    source?: SourceValue;
  }>;
}
export interface DateMetadataProperty extends BaseMetadataProperty {
  readonly type: 'date';
  readonly values: Array<{ value: number; label: string; source?: SourceValue }>;
}

export interface MultiDateMetadataProperty extends Omit<DateMetadataProperty, 'type'> {
  readonly type: 'multidate';
}

export interface DateRangeMetadataProperty extends Omit<BaseMetadataProperty, 'values'> {
  readonly type: 'daterange';
  readonly values: Array<
    {
      value: { from: number; to: number };
      label: { from: string; to: string };
    } & { source?: SourceValue }
  >;
}

export interface MultiDateRangeMetadataProperty extends Omit<DateRangeMetadataProperty, 'type'> {
  readonly type: 'multidaterange';
}

export interface GeolocationMetadataProperty extends Omit<BaseMetadataProperty, 'values'> {
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
  }>;
}

export interface MediaMetadataProperty extends Omit<BaseMetadataProperty, 'values'> {
  readonly type: 'media';
  readonly values: Array<{
    value: string;
    alt?: string;
    timelinks?: Timelink[];
    mimetype?: string;
    fileType?: string;
  }>;
}

export interface ImageMetadataProperty extends Omit<BaseMetadataProperty, 'values'> {
  readonly type: 'image';
  readonly values: Array<{
    value: string;
    alt?: string;
  }>;
}

export interface PreviewMetadataProperty extends Omit<BaseMetadataProperty, 'values'> {
  readonly type: 'preview';
  readonly values: Array<{
    value: string;
  }>;
}

export interface TextMetadataProperty extends BaseMetadataProperty {
  readonly type: 'text';
}

export interface MarkdownMetadataProperty extends Omit<BaseMetadataProperty, 'values'> {
  readonly type: 'markdown';
  readonly values: Array<{
    value: string;
    label: string;
  }>;
}
export interface SelectMetadataProperty extends Omit<BaseMetadataProperty, 'values'> {
  readonly type: 'select';
  readonly values: Array<{
    value: string;
    label?: string;
    translatedLabel?: string;
    selected?: boolean;
    group?: string | null;
    level?: number;
    parent?: {
      label: string;
      translatedLabel?: string;
      value: string;
    };
  }>;
}

export interface MultiSelectMetadataProperty extends Omit<SelectMetadataProperty, 'type'> {
  readonly type: 'multiselect';
}

export interface LinkMetadataProperty extends Omit<BaseMetadataProperty, 'type'> {
  readonly type: 'link';
}

export interface NumericMetadataProperty extends Omit<BaseMetadataProperty, 'type'> {
  readonly type: 'numeric';
}

export interface GeneratedIdMetadataProperty extends Omit<BaseMetadataProperty, 'type'> {
  readonly type: 'generatedid';
}

export interface PermissionMetadataProperty extends Omit<BaseMetadataProperty, 'values' | 'type'> {
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

export type InheritedTypes =
  | DateMetadataProperty["values"]
  | MultiDateMetadataProperty["values"]
  | DateRangeMetadataProperty["values"]
  | MultiDateRangeMetadataProperty["values"]
  | GeolocationMetadataProperty["values"]
  | MediaMetadataProperty["values"]
  | ImageMetadataProperty["values"]
  | PreviewMetadataProperty["values"]
  | TextMetadataProperty["values"]
  | MarkdownMetadataProperty["values"]
  | SelectMetadataProperty["values"]
  | MultiSelectMetadataProperty["values"]
  | LinkMetadataProperty["values"]
  | NumericMetadataProperty["values"]
  | GeneratedIdMetadataProperty["values"]
  | PermissionMetadataProperty['values'];
export interface RelationshipMetadataProperty extends Omit<BaseMetadataProperty, 'values'> {
  readonly type: 'relationship';
  readonly values: InheritedTypes;
}

export type MetadataProperty =
  | BaseMetadataProperty //try to avoid export it
  | DateMetadataProperty
  | MultiDateMetadataProperty
  | DateRangeMetadataProperty
  | MultiDateRangeMetadataProperty
  | GeolocationMetadataProperty
  | MediaMetadataProperty
  | ImageMetadataProperty
  | PreviewMetadataProperty
  | TextMetadataProperty
  | MarkdownMetadataProperty
  | SelectMetadataProperty
  | MultiSelectMetadataProperty
  | LinkMetadataProperty
  | NumericMetadataProperty
  | GeneratedIdMetadataProperty
  | PermissionMetadataProperty
  | RelationshipMetadataProperty
  | EntityPermissions;

export interface EntityTemplate {
  readonly _id: string;
  readonly name: string;
  readonly label?: string;
  readonly translatedLabel?: string;
  readonly color?: string;
  readonly entityViewPage?: string;
}

export interface EntityPermissions {
  readonly refId: string;
  readonly permissions: Array<{
    type: 'user' | 'group';
    refId: string;
    level: 'read' | 'write' | 'mixed';
  }>;
  readonly isPublic: boolean;
  readonly isRestricted: boolean;
  readonly currentUserAccess: 'read' | 'write' | 'admin' | 'none';
}
// readonly canRead: boolean;
// readonly canWrite: boolean;
// readonly canDelete: boolean;
// readonly canShare: boolean;
// readonly userPermissions: string[];
// readonly groupPermissions: string[];
// readonly publicAccess: boolean;
