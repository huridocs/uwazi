export interface Timelink {
  readonly time: number;
  readonly hh: number;
  readonly mm: number;
  readonly ss: number;
  readonly label: string;
}

export interface FormattedEntityPermissions {
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
export type DefaultPropertyTypes = 'text' | 'markdown';
export type ValuePropertyTypes = 'link' | 'preview';
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
  | ValuePropertyTypes
  | NumericPropertyTypes
  | GeneratedIdPropertyTypes
  | 'nested'
  | 'newRelationship';

export interface SourceValue {
  value: string;
  label: string;
  color?: string;
  icon?: string;
  url?: string;
}
export interface InheritedPropertyInfo {
  type: AllowedPropertyTypes;
  name: string;
  label: string;
  translatedLabel?: string;
}
export interface ExtendedPropertyInfo {
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

export interface BaseMetadataProperty {
  readonly _id: string;
  readonly name: string;
  readonly label: string;
  readonly translatedLabel?: string;
  readonly inherited?: boolean;
  readonly inheritedType?: string;
  readonly type: AllowedPropertyTypes;
  readonly properties?: ExtendedPropertyInfo;
}

export interface SimpleMetadataProperty extends BaseMetadataProperty {
  readonly type: 'text' | 'generatedid' | 'numeric' | 'markdown' | 'preview' | 'nested';
  readonly values: Array<{ value: string; source?: SourceValue }>;
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
    source?: SourceValue;
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
    source?: SourceValue;
  }>;
}

export interface ImageMetadataProperty extends Omit<BaseMetadataProperty, 'values'> {
  readonly type: 'image';
  readonly values: Array<{
    value: string;
    alt?: string;
    source?: SourceValue;
  }>;
}

export interface PreviewMetadataProperty extends Omit<BaseMetadataProperty, 'values'> {
  readonly type: 'preview';
  readonly values: Array<{
    value: string;
    alt: string;
    source?: SourceValue;
  }>;
}
export interface MarkdownMetadataProperty extends Omit<BaseMetadataProperty, 'values'> {
  readonly type: 'markdown';
  readonly values: Array<{
    value: string;
    label: string;
    source?: SourceValue;
  }>;
}
export interface SelectMetadataProperty extends Omit<BaseMetadataProperty, 'values'> {
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

export interface MultiSelectMetadataProperty extends Omit<SelectMetadataProperty, 'type'> {
  readonly type: 'multiselect';
}

export interface LinkMetadataProperty extends Omit<BaseMetadataProperty, 'type'> {
  readonly type: 'link';
  readonly values: Array<{
    value: string;
    label?: string;
    source?: SourceValue;
  }>;
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

export interface RelationshipMetadataProperty extends Omit<BaseMetadataProperty, 'values'> {
  readonly type: 'relationship' | 'newRelationship';
  readonly values:
    | MetadataProperty
    | Array<{
        value: string;
        label: string;
        icon?: string;
        url: string;
      }>;
  readonly properties?: ExtendedPropertyInfo;
}

export type MetadataProperty =
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
