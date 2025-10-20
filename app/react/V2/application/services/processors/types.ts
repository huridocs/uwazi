import { Template, ClientSettings, ClientThesaurus, ClientUserSchema } from 'app/apiResponseTypes';
import { ClientTranslationContextSchema, ClientTranslationSchema } from 'app/istore';
import { Entity } from 'app/V2/domain';
import {
  EntityTemplate,
  ExtendedPropertyInfo,
  MetadataProperty,
} from 'app/V2/domain/entities/types';
import { MetadataObjectSchema } from 'shared/types/commonTypes';

export interface ProcessingContext extends CompositionOptions {
  readonly userId?: string;
  readonly userPermissions?: string[];
  readonly language: string;
  readonly translations: ClientTranslationSchema[];
  readonly templates: Template[];
  readonly settings: ClientSettings;
  readonly thesauri: ClientThesaurus[];
  readonly currentUser: ClientUserSchema | undefined;
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

export interface ProcessingError {
  readonly entityId: string;
  readonly error: string;
  readonly timestamp: Date;
}

export interface PropertyTypeProcessor {
  readonly name: string;
  readonly propertyTypes: string[];

  processBatch(
    properties: AdapterMetadataProperty[],
    context: ProcessingContext,
    processors?: Map<string, PropertyTypeProcessor>
  ): AdapterMetadataProperty[];
}

export interface CompositionContext {
  readonly userId?: string;
  readonly userPermissions?: string[];
  readonly language: string;
  readonly includePermissions: boolean;
}

export interface CompositionOptions {
  // Core inclusion options
  entityBasePath?: string;
  includeTemplate?: boolean;
  onlyForCards?: boolean;
  includePropertyMetadata?: boolean;
  formatDates?: boolean;
  includeRawEntity?: boolean;

  // Field selection
  includeFields?: string[];

  // Processing modes
  editionMode?: boolean;
  translateLabels?: boolean;

  // Formatting options
  dateFormat?: string;
  combineGeolocation?: boolean;

  // Select options
  includeOptions?: boolean;

  // Processor-specific options
  timezone?: string;
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

export type AdapterEntityTemplate = EntityTemplate & {
  readonly properties: Map<string, AdapterMetadataProperty>;
  readonly commonProperties: Map<string, AdapterMetadataProperty>;
};

export type AdapterEntity = Omit<Entity, 'template' | 'creationDate' | 'editDate'> & {
  template: AdapterEntityTemplate;
  creationDate: AdapterMetadataProperty;
  editDate: AdapterMetadataProperty;
};

export type AdapterMetadataProperty = MetadataProperty & {
  _id: string;
  entity: AdapterEntity;
  index: number;
  value: MetadataObjectSchema[];
  properties: ExtendedPropertyInfo & {
    translationContext?: ClientTranslationContextSchema;
  };
};
