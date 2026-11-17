import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { PropertyType } from './PropertyType.js';

type Icon = {
  id: string;
  label: string;
  type: string;
};

type BaseMetadataValue = {
  value: any;
  label?: string;
  attributes?: string[];
};

type EntryAttributes = { attributes?: string[] };

export type TextPropertyValue = { value: string } & EntryAttributes;
export type NumericPropertyValue = { value: number } & EntryAttributes;
export type MarkdownEntry = { value: string } & EntryAttributes;
export type DateEntry = { value: number } & EntryAttributes;
export type DateRangeEntry = {
  value: { from: number | null; to: number | null };
} & EntryAttributes;
export type GeolocationEntry = {
  value: { lat: number; lon: number; label?: string };
} & EntryAttributes;
export type SelectionEntry = {
  value: string;
  label: string;
  parent?: {
    value: string;
    label: string;
  };
} & EntryAttributes;

export type LinkEntry = { value: { url: string; label?: string } } & EntryAttributes;

export type InheritedValue =
  | TextPropertyValue
  | MarkdownEntry
  | NumericPropertyValue
  | DateEntry
  | DateRangeEntry
  | GeolocationEntry
  | SelectionEntry
  | NestedEntry
  | ImageEntry
  | MediaEntry
  | PreviewEntry
  | LinkEntry
  | GeneratedIdEntry;

export type RelationshipEntry = {
  value: string;
  label: string;
  type: string;
  icon?: Icon;
  inheritedType?: PropertyType;
  inheritedValue?: InheritedValue[];
} & EntryAttributes;

export type NestedEntry = {
  value: { [childName: string]: BaseMetadataValue[] };
} & EntryAttributes;

export type ImageEntry = { value: string } & EntryAttributes;
export type MediaEntry = { value: string } & EntryAttributes;
export type PreviewEntry = { value: string } & EntryAttributes;
export type GeneratedIdEntry = { value: string } & EntryAttributes;

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
  | GeneratedIdEntry;

export type SelectPropertyAssignment = {
  language: LanguageISO6391;
} & PropertyAssignment<SelectionEntry>;

export type RelationshipPropertyAssignment = {
  language: LanguageISO6391;
} & PropertyAssignment<RelationshipEntry>;

export type PropertyAssignment<Value = PropertyValue> = {
  name: string;
  type: PropertyType;
  value: Value[];
  isTranslatable: boolean;
};
