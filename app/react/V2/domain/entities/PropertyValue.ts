export interface PropertyValue<T = any> {
  readonly value: T;
  readonly label?: string;
  readonly displayValue?: string;
  readonly formattedValue?: any;
  readonly metadata?: PropertyValueMetadata;
  // Additional properties for specific types
  readonly icon?: string;
  readonly url?: string;
  readonly alt?: string;
  readonly dateObject?: Date | { from: Date | null; to: Date | null } | null;
  readonly [key: string]: any;
}

export interface PropertyValueMetadata {
  readonly isInherited?: boolean;
  readonly inheritedFrom?: string;
  readonly originalValue?: any;
  readonly timestamp?: number;
  readonly style?: string;
  readonly icon?: string;
  readonly url?: string;
  readonly extra?: Record<string, any>;
}

export interface DatePropertyValue extends PropertyValue<number | number[]> {
  readonly formattedValue: {
    readonly originalValue: number | number[];
    readonly formattedValue: string | string[];
    readonly displayValue: string | string[];
  };
  readonly dateObject: Date | null;
}

export interface DateRangePropertyValue
  extends PropertyValue<{ from: number; to: number } | Array<{ from: number; to: number }>> {
  readonly formattedValue: {
    readonly originalValue: { from: number; to: number } | Array<{ from: number; to: number }>;
    readonly formattedValue: string | string[];
    readonly displayValue: string | string[];
  };
  readonly dateObject: { from: Date | null; to: Date | null };
}

export interface SelectPropertyValue extends PropertyValue<string | string[]> {
  readonly formattedValue: {
    readonly value: string | string[];
    readonly label: string | string[];
    readonly url?: string | string[];
    readonly icon?: string | string[];
  };
}

export interface RelationshipPropertyValue extends PropertyValue<string[]> {
  readonly formattedValue: {
    readonly entityIds: string[];
    readonly relationshipType: string;
    readonly thesaurus: any[];
  };
}

export interface GeolocationPropertyValue
  extends PropertyValue<{ latitude: number; longitude: number }> {
  readonly formattedValue: {
    readonly latitude: number;
    readonly longitude: number;
    readonly visualization: string;
  };
  readonly name?: string;
  readonly label?: string;
}

export interface FilePropertyValue extends PropertyValue<any> {
  readonly formattedValue: {
    readonly fileName: string;
    readonly url: string;
    readonly type: string;
    readonly size: number;
    readonly style: string;
    readonly label: string;
  };
}

export interface MarkdownPropertyValue extends PropertyValue<string> {
  readonly formattedValue: {
    readonly html: string;
    readonly text: string;
  };
}

export interface InheritPropertyValue extends PropertyValue<any> {
  readonly formattedValue: {
    readonly originalValue: any;
    readonly inherited: boolean;
    readonly inheritedFrom: string;
  };
}

export interface NestedPropertyValue extends PropertyValue<PropertyValue[]> {
  readonly formattedValue: PropertyValue[];
}

export type AnyPropertyValue =
  | DatePropertyValue
  | DateRangePropertyValue
  | SelectPropertyValue
  | RelationshipPropertyValue
  | GeolocationPropertyValue
  | FilePropertyValue
  | MarkdownPropertyValue
  | InheritPropertyValue
  | NestedPropertyValue
  | PropertyValue;

export interface NormalizedPropertyDescriptor {
  readonly id: string;
  readonly name: string;
  readonly label: string;
  readonly type: string;
  readonly language: string;

  // Flags
  readonly required: boolean;
  readonly multiple: boolean;
  readonly showInCard: boolean;
  readonly noLabel: boolean;
  readonly fullWidth: boolean;
  readonly obsolete: boolean;

  // Inheritance
  readonly isInherited: boolean;
  readonly inheritedType?: string;
  readonly inheritedFrom?: string;
  readonly originalValue?: any;

  // UI/Meta
  readonly translateContext?: string;
  readonly indexInTemplate?: number;
  readonly parent?: string;
  readonly style?: string;
  readonly icon?: string;
  readonly url?: string;

  // Raw data
  readonly rawValue: any;
  readonly path: string;

  // Normalized values (unified structure)
  readonly values: AnyPropertyValue[];

  // Precomputed lookups (injected)
  readonly lookups: {
    readonly selectOptionByValue: Record<
      string,
      { label: string; icon?: string; url?: string; extra?: any }
    >;
    readonly thesaurusById: Record<
      string,
      { id: string; name: string; valuesByKey: Record<string, any> }
    >;
    readonly relationshipTypeById: Record<
      string,
      { id: string; name: string; leftTemplates: string[]; rightTemplates: string[] }
    >;
    readonly templateById: Record<
      string,
      { id: string; name: string; propertiesByName: Record<string, any> }
    >;
    readonly mediaConfig: { defaultStyle: string; mimeGroups: Record<string, string[]> };
    readonly dateConfig: { defaultFormat: string; locale: string };
  };
}
