/* eslint-disable max-lines */
import { ProcessingError } from 'app/V2/application/services/processors/types';
import { Entity } from './Entity';

export interface Timelink {
  readonly time: string;
  readonly hh: string;
  readonly mm: string;
  readonly ss: string;
  readonly label: string;
}

export interface CompositionContext {
  readonly userId?: string;
  readonly userPermissions?: string[];
  readonly language: string;
  readonly includePermissions: boolean;
}

export interface CompositionOptions {
  // Core inclusion options
  includeTemplate?: boolean;
  includeMetadata?: boolean;
  includeRelationships?: boolean;
  includeFiles?: boolean;
  includeNavigation?: boolean;
  includePermissions?: boolean;
  onlyForCards?: boolean;
  includePropertyMetadata?: boolean;
  formatDates?: boolean;

  // Field selection
  includeFields?: string[];

  // Processing modes
  editionMode?: boolean;
  translateLabels?: boolean;

  // Formatting options
  dateFormat?: string;
  combineGeolocation?: boolean;

  includeFileMetadata?: boolean;
  includeThumbnails?: boolean;
  maxFileSize?: number;
  allowedTypes?: string[];

  // Flattening options
  flattenStructures?: boolean;
  flattenRelationships?: boolean;
  flattenCoordinates?: boolean;
  flattenMediaFiles?: boolean;
  flattenTimelines?: boolean;

  // Permission options
  includeAccessLevel?: boolean;
  includeSharedWith?: boolean;

  // Relationship options
  nestedLevel?: number;
  includeEntityData?: boolean;
  includeTemplates?: boolean;
  maxRelationships?: number;

  // Select options
  includeOptions?: boolean;

  // Processor-specific options
  timezone?: string;
  includeTime?: boolean;
  relativeTime?: boolean;
  showLabels?: boolean;
  showIcons?: boolean;
  showUrls?: boolean;
  precision?: number;
  includeMapData?: boolean;
}

export interface CompositionResult {
  readonly entity: Entity | null;
  readonly success: boolean;
  readonly error?: string;
}

export interface BatchCompositionResult {
  readonly entities: Entity[];
  readonly errors: ProcessingError[];
  readonly success: boolean;
  readonly totalProcessed: number;
  readonly successCount: number;
  readonly errorCount: number;
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

export interface ComposedTemplate {
  readonly _id: string;
  readonly name: string;
  readonly label?: string;
  readonly translatedLabel?: string;
  readonly color?: string;
  readonly properties?: Map<string, ComposedProperty>;
  readonly commonProperties?: Map<string, ComposedProperty>;
  readonly entityViewPage?: string;
}

export interface ComposedProperty {
  readonly index?: number;
  readonly id: string;
  readonly name: string;
  readonly label: string;
  readonly type: string;
  readonly value: any;
  readonly formattedValue: any;
  readonly displayValue: string;
  readonly showInCard: boolean;
  readonly noLabel: boolean;
  readonly style?: string;
  readonly inherit?: any;
  readonly denormalizedProperty?: string;
  readonly indexInTemplate?: number;
  readonly fullWidth?: boolean;
  readonly obsolete?: boolean;
  readonly translateContext?: string;
  readonly parent?: string;
  readonly members?: any[];
  readonly fileName?: string;
  readonly timeLinks?: any;
  readonly relatedEntity?: any;
  readonly inheritedType?: string;
  readonly originalValue?: any;
  readonly icon?: string;
  readonly timestamp?: number;
  readonly sortedBy?: boolean;
}

export interface ComposedRelationshipData {
  readonly hubs: ComposedRelationshipHub[];
  readonly connections: ComposedRelationship[];
  readonly summary: RelationshipSummary;
  readonly navigation: {
    readonly hasPageView: boolean;
    readonly hasRelationships: boolean;
  };
}

export interface ComposedRelationshipHub {
  readonly hubId: string;
  readonly order: number;
  readonly leftRelationship: ComposedRelationship;
  readonly rightRelationships: Record<string, ComposedRelationship[]>;
}

export interface ComposedRelationship {
  readonly id: string;
  readonly sourceEntityId: string;
  readonly targetEntityId: string;
  readonly templateId: string;
  readonly hub?: string;
}

export interface RelationshipSummary {
  readonly totalConnections: number;
  readonly hubCount: number;
}

export interface ComposedFileData {
  readonly documents: ComposedDocument[];
  readonly attachments: ComposedAttachment[];
  readonly processed: boolean;
}

export interface ComposedDocument {
  readonly id: string;
  readonly filename: string;
  readonly url: string;
  readonly type: string;
  readonly size: number;
  readonly processed: boolean;
}

export interface ComposedAttachment {
  readonly id: string;
  readonly filename: string;
  readonly originalname: string;
  readonly url: string;
  readonly type: string;
  readonly size: number;
  readonly mimetype: string;
  readonly fileLocalID?: string;
  readonly timeLinks?: any;
}

export interface ComposedNavigationData {
  readonly hasPageView: boolean;
  readonly hasRelationships: boolean;
  readonly hasNewRelationships: boolean;
  readonly panelOpen: boolean;
  readonly copyFrom: boolean;
  readonly copyFromProps: string[];
}

// Define allowed property types for each processor
export type DatePropertyTypes = 'date' | 'multidate' | 'daterange' | 'multidaterange';
export type SelectPropertyTypes = 'select' | 'multiselect';
export type GeolocationPropertyTypes = 'geolocation';
export type RelationshipPropertyTypes = 'relationship';
export type FilePropertyTypes = 'image' | 'media' | 'file';
export type PermissionPropertyTypes = 'permissions';
export type DefaultPropertyTypes = 'text' | 'markdown' | 'preview' | 'any';
export type LinkPropertyTypes = 'link';
export type NumericPropertyTypes = 'numeric';
export type GeneratedIdPropertyTypes = 'generatedid';

// Union of all supported property types
export type AllowedPropertyTypes =
  | DatePropertyTypes
  | SelectPropertyTypes
  | GeolocationPropertyTypes
  | RelationshipPropertyTypes
  | FilePropertyTypes
  | PermissionPropertyTypes
  | DefaultPropertyTypes
  | LinkPropertyTypes
  | NumericPropertyTypes
  | GeneratedIdPropertyTypes;

// Discriminated union types for each property type
export interface DateMetadataProperty {
  readonly name: string;
  readonly label: string;
  readonly type: 'date';
  readonly values: Array<{ value: number; label?: string; dateObject?: Date }>;
  readonly inherited?: boolean;
  readonly properties?: {
    template?: {
      _id: string;
      name: string;
      label: string;
      color: string;
    };
    inheritedProperty?: {
      type: AllowedPropertyTypes;
      name: string;
      label: string;
    };
  };
  readonly translatedLabel?: string;
  readonly propertyMetadata?: any;
  readonly index?: number;
}

export interface MultiDateMetadataProperty {
  readonly name: string;
  readonly label: string;
  readonly type: 'multidate';
  readonly translatedLabel?: string;
  readonly values: Array<{
    value: number;
    label?: string;
    displayValue?: string;
    properties?: {
      dateObject?: Date;
      [key: string]: any;
    };
  }>;
  readonly properties?: {
    template?: {
      _id: string;
      name: string;
      label: string;
      color: string;
    };
    inherited?: {
      property: string;
      type: AllowedPropertyTypes;
      name: string;
      label: string;
    };
    metadata?: Record<string, any>;
  };
}

export interface DateRangeMetadataProperty {
  readonly name: string;
  readonly label: string;
  readonly type: 'daterange';
  readonly translatedLabel?: string;
  readonly values: Array<{
    value: { from: number; to: number };
    label?: string;
    displayValue?: string;
    properties?: {
      [key: string]: any;
    };
  }>;
  readonly properties?: {
    template?: {
      _id: string;
      name: string;
      label: string;
      color: string;
    };
    inherited?: {
      property: string;
      type: AllowedPropertyTypes;
      name: string;
      label: string;
    };
    metadata?: Record<string, any>;
  };
}

export interface MultiDateRangeMetadataProperty {
  readonly name: string;
  readonly label: string;
  readonly type: 'multidaterange';
  readonly translatedLabel?: string;
  readonly values: Array<{
    value: { from: number; to: number };
    label?: string;
    displayValue?: string;
    properties?: {
      [key: string]: any;
    };
  }>;
  readonly properties?: {
    template?: {
      _id: string;
      name: string;
      label: string;
      color: string;
    };
    inherited?: {
      property: string;
      type: AllowedPropertyTypes;
      name: string;
      label: string;
    };
    metadata?: Record<string, any>;
  };
}

export interface GeolocationMetadataProperty {
  readonly name: string;
  readonly label: string;
  readonly type: 'geolocation';
  readonly translatedLabel?: string;
  readonly values: Array<{
    value: { latitude: number; longitude: number };
    label?: string;
    displayValue?: string;
    properties?: {
      color?: string;
      entity?: {
        id: string;
        label: string;
        icon?: string;
        url?: string;
      };
      [key: string]: any;
    };
  }>;
  readonly properties?: {
    template?: {
      _id: string;
      name: string;
      label: string;
      color: string;
    };
    inherited?: {
      property: string;
      type: AllowedPropertyTypes;
      name: string;
      label: string;
    };
    metadata?: Record<string, any>;
  };
}

export interface RelationshipMetadataProperty {
  readonly name: string;
  readonly label: string;
  readonly type: 'relationship';
  readonly translatedLabel?: string;
  readonly values: Array<{
    value: string | { sharedId: string; id?: string };
    label: string;
    displayValue?: string;
    url: string;
    icon?: string;
    inheritedValue?: Array<{
      value: string;
      label: string;
    }>;
    inheritedType?: string;
    properties?: {
      entity?: {
        _id: string;
        label: string;
        icon?: string;
        url?: string;
      };
      [key: string]: any;
    };
  }>;
  readonly properties?: {
    template?: {
      _id: string;
      name: string;
      label: string;
      color: string;
    };
    inherited?: {
      property: string;
      type: AllowedPropertyTypes;
      name: string;
      label: string;
    };
    metadata?: Record<string, any>;
  };
}

export interface MediaMetadataProperty {
  readonly name: string;
  readonly label: string;
  readonly type: 'media';
  readonly translatedLabel?: string;
  readonly values: Array<{
    value: string;
    label?: string;
    displayValue?: string;
    properties?: {
      alt?: string;
      timelinks?: Timelink[];
      [key: string]: any;
    };
  }>;
  readonly properties?: {
    template?: {
      _id: string;
      name: string;
      label: string;
      color: string;
    };
    inherited?: {
      property: string;
      type: AllowedPropertyTypes;
      name: string;
      label: string;
    };
    metadata?: Record<string, any>;
  };
}

export interface ImageMetadataProperty {
  readonly name: string;
  readonly label: string;
  readonly type: 'image';
  readonly translatedLabel?: string;
  readonly values: Array<{
    value: string;
    label?: string;
    displayValue?: string;
    properties?: {
      alt?: string;
      timelinks?: Timelink[];
      [key: string]: any;
    };
  }>;
  readonly properties?: {
    template?: {
      _id: string;
      name: string;
      label: string;
      color: string;
    };
    inherited?: {
      property: string;
      type: AllowedPropertyTypes;
      name: string;
      label: string;
    };
    metadata?: Record<string, any>;
  };
}

export interface PreviewMetadataProperty {
  readonly name: string;
  readonly label: string;
  readonly type: 'preview';
  readonly translatedLabel?: string;
  readonly values: Array<{
    value: string;
    label?: string;
    displayValue?: string;
    properties?: {
      alt?: string;
      timelinks?: Timelink[];
      [key: string]: any;
    };
  }>;
  readonly properties?: {
    template?: {
      _id: string;
      name: string;
      label: string;
      color: string;
    };
    inherited?: {
      property: string;
      type: AllowedPropertyTypes;
      name: string;
      label: string;
    };
    metadata?: Record<string, any>;
  };
}

export interface TextMetadataProperty {
  readonly name: string;
  readonly label: string;
  readonly type: 'text';
  readonly translatedLabel?: string;
  readonly values: Array<{
    value: string;
    label?: string;
    displayValue?: string;
    properties?: {
      [key: string]: any;
    };
  }>;
  readonly properties?: {
    template?: {
      _id: string;
      name: string;
      label: string;
      color: string;
    };
    inherited?: {
      property: string;
      type: AllowedPropertyTypes;
      name: string;
      label: string;
    };
    metadata?: Record<string, any>;
  };
}

export interface MarkdownMetadataProperty {
  readonly name: string;
  readonly label: string;
  readonly type: 'markdown';
  readonly translatedLabel?: string;
  readonly values: Array<{
    value: string;
    label?: string;
    displayValue?: string;
    properties?: {
      [key: string]: any;
    };
  }>;
  readonly properties?: {
    template?: {
      _id: string;
      name: string;
      label: string;
      color: string;
    };
    inherited?: {
      property: string;
      type: AllowedPropertyTypes;
      name: string;
      label: string;
    };
    metadata?: Record<string, any>;
  };
}

export interface SelectMetadataProperty {
  readonly name: string;
  readonly label: string;
  readonly type: 'select';
  readonly translatedLabel?: string;
  readonly values: Array<{
    value: any;
    label?: string;
    displayValue?: string;
    url?: string;
    icon?: any;
    parent?: {
      label: string;
      value: string;
    };
    properties?: {
      [key: string]: any;
    };
  }>;
  readonly properties?: {
    template?: {
      _id: string;
      name: string;
      label: string;
      color: string;
    };
    inherited?: {
      property: string;
      type: AllowedPropertyTypes;
      name: string;
      label: string;
    };
    metadata?: Record<string, any>;
  };
}

export interface MultiSelectMetadataProperty {
  readonly name: string;
  readonly label: string;
  readonly type: 'multiselect';
  readonly translatedLabel?: string;
  readonly values: Array<{
    value: any;
    label?: string;
    displayValue?: string;
    url?: string;
    icon?: any;
    parent?: {
      label: string;
      value: string;
    };
    properties?: {
      [key: string]: any;
    };
  }>;
  readonly properties?: {
    template?: {
      _id: string;
      name: string;
      label: string;
      color: string;
    };
    inherited?: {
      property: string;
      type: AllowedPropertyTypes;
      name: string;
      label: string;
    };
    metadata?: Record<string, any>;
  };
}

export interface LinkMetadataProperty {
  readonly name: string;
  readonly label: string;
  readonly type: 'link';
  readonly translatedLabel?: string;
  readonly values: Array<{
    value: {
      label: string;
      url: string;
    };
    label?: string;
    displayValue?: string;
    properties?: {
      [key: string]: any;
    };
  }>;
  readonly properties?: {
    template?: {
      _id: string;
      name: string;
      label: string;
      color: string;
    };
    inherited?: {
      property: string;
      type: AllowedPropertyTypes;
      name: string;
      label: string;
    };
    metadata?: Record<string, any>;
  };
}

export interface NumericMetadataProperty {
  readonly name: string;
  readonly label: string;
  readonly type: 'numeric';
  readonly translatedLabel?: string;
  readonly values: Array<{
    value: number;
    label?: string;
    displayValue?: string;
    properties?: {
      [key: string]: any;
    };
  }>;
  readonly properties?: {
    template?: {
      _id: string;
      name: string;
      label: string;
      color: string;
    };
    inherited?: {
      property: string;
      type: AllowedPropertyTypes;
      name: string;
      label: string;
    };
    metadata?: Record<string, any>;
  };
}

export interface GeneratedIdMetadataProperty {
  readonly name: string;
  readonly label: string;
  readonly type: 'generatedid';
  readonly translatedLabel?: string;
  readonly values: Array<{
    value: string;
    label?: string;
    displayValue?: string;
    properties?: {
      [key: string]: any;
    };
  }>;
  readonly properties?: {
    template?: {
      _id: string;
      name: string;
      label: string;
      color: string;
    };
    inherited?: {
      property: string;
      type: AllowedPropertyTypes;
      name: string;
      label: string;
    };
    metadata?: Record<string, any>;
  };
}

// Discriminated union for all metadata property types
export type MetadataProperty =
  | DateMetadataProperty
  | MultiDateMetadataProperty
  | DateRangeMetadataProperty
  | MultiDateRangeMetadataProperty
  | GeolocationMetadataProperty
  | RelationshipMetadataProperty
  | MediaMetadataProperty
  | ImageMetadataProperty
  | PreviewMetadataProperty
  | TextMetadataProperty
  | MarkdownMetadataProperty
  | SelectMetadataProperty
  | MultiSelectMetadataProperty
  | LinkMetadataProperty
  | NumericMetadataProperty
  | GeneratedIdMetadataProperty;
