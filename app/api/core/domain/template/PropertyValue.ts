import { LanguageISO6391 } from 'shared/types/commonTypes';
import { PropertyType } from './PropertyType';

type Icon = {
  label: string;
  type: string;
};

type BaseMetadataValue = {
  value: any;
  label?: string;
};

export type InheritedResultValue = BaseMetadataValue & {
  inheritedValue?: BaseMetadataValue[];
  inheritedType?: string;
  icon?: Icon;
  // legacy tag occasionally present in v1 relationship entries
  type?: 'entity';
};

export type TextPropertyValue = { value: string };
export type NumericPropertyValue = { value: number };
export type MarkdownEntry = { value: string };
export type DateEntry = { value: number };
export type DateRangeEntry = { value: { from: number; to: number } };
export type GeolocationEntry = { value: { lat: number; lon: number; label?: string } };
export type SelectionEntry = {
  value: string;
  label: string;
  parent?: {
    value: string;
    label: string;
  };
};
export type LinkEntry = { value: { url: string; label?: string } };

export type RelationshipEntry = InheritedResultValue & { value: string };

export type NestedEntry = { value: { [childName: string]: BaseMetadataValue[] } };

export type ImageEntry = { value: string };
export type MediaEntry = { value: string };
export type PreviewEntry = { value: string };
export type GeneratedIdEntry = { value: string };

export type PropertyValue =
  | TextPropertyValue
  | MarkdownEntry
  | NumericPropertyValue
  | DateEntry
  | DateRangeEntry
  | GeolocationEntry
  | SelectionEntry
  | RelationshipEntry
  | NestedEntry
  | ImageEntry
  | MediaEntry
  | PreviewEntry
  | LinkEntry
  | GeneratedIdEntry
  | BaseMetadataValue;

export type SelectPropertyAssignment = {
  language: LanguageISO6391;
} & PropertyAssignment<SelectionEntry>;

export type PropertyAssignment<Value = PropertyValue> = {
  name: string;
  type: PropertyType;
  value: Value[];
};
