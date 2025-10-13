import { Template, ClientSettings, ClientThesaurus, ClientUserSchema } from 'app/apiResponseTypes';
import { ClientTranslationSchema } from 'app/istore';
import { CompositionOptions } from 'app/V2/domain';

export interface PropertyValue {
  value: any;
  label?: string;
  displayValue?: string;
  formattedValue?: any;
  localizedValue?: string;
  icon?: string;
  url?: string;
  error?: string;
  [key: string]: any;
}

export interface PropertyMetadata {
  showInCard: boolean;
  propertyType: string;
  isInherited: boolean;
  isRequired: boolean;
  isMultiple: boolean;
  noLabel: boolean;
  fullWidth: boolean;
  obsolete: boolean;
  indexInTemplate?: number;
  parent?: string;
  translateContext?: string;
  fileName?: string;
  timeLinks?: any;
  relatedEntity?: any;
  inheritedType?: string;
  inheritedValue?: any;
  denormalizedProperty?: string;
  sortedBy?: boolean;
  timestamp?: number;
  style?: string;
  url?: string;
  icon?: string;
  // Type-specific metadata
  [key: string]: any;
}

export interface FormattedProperty {
  values: PropertyValue[];
  label: string;
  name: string;
  translatedLabel?: string;
  propertyMetadata: PropertyMetadata;
  type: string;
  originalValue?: any;
  [key: string]: any;
}

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
    properties: any[],
    context: ProcessingContext
  ): Promise<Map<string, FormattedProperty>>;
}
