import type { PropertyType } from '#api/core/domain/template/PropertyType.js';

/**
 * An id as the client holds it: a string, or an ObjectId straight from a template the API sent.
 */
type Id = string | { toString(): string };

/**
 * A property as the template editor holds it. Structurally compatible with `ClientProperty`, so
 * the editor can pass its form state as it is.
 */
type PropertyInput = {
  _id?: Id;
  label: string;
  type: PropertyType;
  /** The stored name. Read only for properties of templates other than the one being edited. */
  name?: string;
  /** The thesaurus (select, multiselect) or target template (relationship). */
  content?: string;
  relationType?: string;
  inherit?: { property?: string; type?: PropertyType };
};

type CommonPropertyInput = {
  _id?: Id;
  label: string;
  type: PropertyType;
  name: string;
};

/**
 * A template as the client holds it. Structurally compatible with `ClientTemplateSchema`.
 */
type TemplateInput = {
  _id?: Id;
  name: string;
  commonProperties?: CommonPropertyInput[];
  properties?: PropertyInput[];
};

export type { Id, PropertyInput, CommonPropertyInput, TemplateInput, PropertyType };
