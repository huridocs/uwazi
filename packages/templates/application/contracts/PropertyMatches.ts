import type { PropertyConflict } from '#api/core/domain/template/PropertyConflict.js';
import type { PropertyType } from '#api/core/domain/template/PropertyType.js';

/**
 * A property in another template that has the same name as the candidate. `conflicts` lists what
 * would make saving the candidate fail; an empty list means the two would be combined, for
 * example in library filters.
 */
type PropertyMatch = {
  templateId: string;
  templateName: string;
  propertyId?: string;
  label: string;
  type: PropertyType;
  conflicts: PropertyConflict[];
};

type PropertyMatches = {
  /** The name the candidate will get when the template is saved. */
  name: string;
  matches: PropertyMatch[];
};

/**
 * A property in the same template that has the same name as the candidate. Saving fails while
 * one exists.
 */
type TemplateDuplicate = {
  propertyId?: string;
  label: string;
  name: string;
  isCommonProperty: boolean;
};

export type { PropertyConflict, PropertyMatch, PropertyMatches, TemplateDuplicate };
