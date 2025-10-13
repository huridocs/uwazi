import { ProcessingError } from 'app/V2/application/services/processors/types';
import { Entity } from './Entity';

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
  readonly properties: Map<string, ComposedProperty>;
  readonly commonProperties: Map<string, ComposedProperty>;
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
