import type { Path, UseFormSetError } from 'react-hook-form';
import type { ApiValidation } from '#shared/apiClient/index.js';
import type { FormMetadataProperty } from './formatMetadataForForm.js';

type EditEntityFormValues = {
  title: string;
  template: string;
  showIcon: boolean;
  icon: unknown;
  metadata: Record<string, unknown[]>;
};

type EditEntityErrors = {
  title?: string;
  template?: string;
  metadata?: Record<string, string | undefined>;
};

const parseMetadataPropertyName = (instancePath: string): string | undefined => {
  const bracketMatch = instancePath.match(/^\.metadata\['([^']+)'\]$/);
  if (bracketMatch) return bracketMatch[1];

  const slashMatch = instancePath.match(/^\/metadata\/([^/]+)/);
  if (slashMatch) return slashMatch[1];

  return undefined;
};

const apiValidationsToEditEntityErrors = (
  validations: ApiValidation[] | undefined
): EditEntityErrors | undefined => {
  if (!validations?.length) return undefined;

  const errors: EditEntityErrors = {};
  const metadata: Record<string, string> = {};

  validations.forEach(({ instancePath, message }) => {
    if (!message) return;

    if (instancePath === '.title' || instancePath === '/title') {
      if (!errors.title) errors.title = message;
      return;
    }

    if (instancePath === '.template' || instancePath === '/template') {
      if (!errors.template) errors.template = message;
      return;
    }

    const propertyName = parseMetadataPropertyName(instancePath);
    if (propertyName && !metadata[propertyName]) {
      metadata[propertyName] = message;
    }
  });

  if (Object.keys(metadata).length > 0) {
    errors.metadata = metadata;
  }

  if (!errors.title && !errors.template && !errors.metadata) {
    return undefined;
  }

  return errors;
};

const buildRelationshipPrimaryNames = (properties: FormMetadataProperty[]) => {
  const primaryByPropertyName = new Map<string, string>();
  const primaryByGroupKey = new Map<string, string>();

  properties.forEach(property => {
    if (property.type !== 'relationship') {
      return;
    }

    const groupKey = `${property.content ?? ''}::${property.relationType ?? ''}`;
    const primaryName = primaryByGroupKey.get(groupKey) ?? property.name;

    if (!primaryByGroupKey.has(groupKey)) {
      primaryByGroupKey.set(groupKey, property.name);
    }

    primaryByPropertyName.set(property.name, primaryName);
  });

  return primaryByPropertyName;
};

const getMetadataFieldPath = (property: FormMetadataProperty): Path<EditEntityFormValues> => {
  switch (property.type) {
    case 'select':
    case 'multiselect':
    case 'relationship':
    case 'nested':
    case 'multidate':
    case 'multidaterange':
      return `metadata.${property.name}`;
    default:
      return `metadata.${property.name}.0.value`;
  }
};

const resolveMetadataErrorPath = (
  property: FormMetadataProperty,
  relationshipPrimaryNames: Map<string, string>
): Path<EditEntityFormValues> => {
  if (property.type === 'relationship') {
    const primaryName = relationshipPrimaryNames.get(property.name) ?? property.name;
    return `metadata.${primaryName}`;
  }

  return getMetadataFieldPath(property);
};

const findFirstMetadataErrorPath = (
  metadataErrors: Record<string, string | undefined>,
  metadataProperties: FormMetadataProperty[]
): string | undefined => {
  const relationshipPrimaryNames = buildRelationshipPrimaryNames(metadataProperties);
  const propertyByName = new Map(metadataProperties.map(property => [property.name, property]));

  const knownProperty = metadataProperties.find(property => metadataErrors[property.name]);
  if (knownProperty) {
    return resolveMetadataErrorPath(knownProperty, relationshipPrimaryNames);
  }

  const unknownEntry = Object.entries(metadataErrors).find(
    ([name, message]) => message && !propertyByName.has(name)
  );
  return unknownEntry ? `metadata.${unknownEntry[0]}` : undefined;
};

const getFirstEditEntityErrorPath = (
  errors: EditEntityErrors,
  metadataProperties: FormMetadataProperty[]
): string | undefined => {
  if (errors.title) return 'title';
  if (errors.template) return 'template';
  if (!errors.metadata) return undefined;

  return findFirstMetadataErrorPath(errors.metadata, metadataProperties);
};

const applyScalarEditEntityError = (
  setError: UseFormSetError<EditEntityFormValues>,
  path: 'title' | 'template',
  message: string | undefined,
  appliedPaths: Set<string>
) => {
  if (!message) return;

  setError(path, { type: 'server', message });
  appliedPaths.add(path);
};

const applyMetadataEditEntityErrors = (
  setError: UseFormSetError<EditEntityFormValues>,
  metadataErrors: Record<string, string | undefined>,
  metadataProperties: FormMetadataProperty[],
  appliedPaths: Set<string>
) => {
  const relationshipPrimaryNames = buildRelationshipPrimaryNames(metadataProperties);
  const propertyByName = new Map(metadataProperties.map(property => [property.name, property]));

  Object.entries(metadataErrors).forEach(([name, message]) => {
    if (!message) return;

    const property = propertyByName.get(name);
    const path = property
      ? resolveMetadataErrorPath(property, relationshipPrimaryNames)
      : (`metadata.${name}` as Path<EditEntityFormValues>);

    if (appliedPaths.has(path)) return;

    setError(path, { type: 'server', message });
    appliedPaths.add(path);
  });
};

const applyEditEntityErrors = (
  setError: UseFormSetError<EditEntityFormValues>,
  errors: EditEntityErrors | undefined,
  metadataProperties: FormMetadataProperty[]
) => {
  if (!errors) return;

  const appliedPaths = new Set<string>();

  applyScalarEditEntityError(setError, 'title', errors.title, appliedPaths);
  applyScalarEditEntityError(setError, 'template', errors.template, appliedPaths);

  if (errors.metadata) {
    applyMetadataEditEntityErrors(setError, errors.metadata, metadataProperties, appliedPaths);
  }
};

export {
  apiValidationsToEditEntityErrors,
  applyEditEntityErrors,
  buildRelationshipPrimaryNames,
  getFirstEditEntityErrorPath,
  getMetadataFieldPath,
  resolveMetadataErrorPath,
};
export type { EditEntityErrors, EditEntityFormValues };
