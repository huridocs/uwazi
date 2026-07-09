import type { Path, UseFormSetError } from 'react-hook-form';
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

const getFirstEditEntityErrorPath = (
  errors: EditEntityErrors,
  metadataProperties: FormMetadataProperty[]
): string | undefined => {
  if (errors.title) {
    return 'title';
  }

  if (errors.template) {
    return 'template';
  }

  if (!errors.metadata) {
    return undefined;
  }

  const relationshipPrimaryNames = buildRelationshipPrimaryNames(metadataProperties);
  const propertyByName = new Map(metadataProperties.map(property => [property.name, property]));

  for (const property of metadataProperties) {
    const message = errors.metadata[property.name];
    if (message) {
      return resolveMetadataErrorPath(property, relationshipPrimaryNames);
    }
  }

  for (const [name, message] of Object.entries(errors.metadata)) {
    if (message && !propertyByName.has(name)) {
      return `metadata.${name}`;
    }
  }

  return undefined;
};

const applyEditEntityErrors = (
  setError: UseFormSetError<EditEntityFormValues>,
  errors: EditEntityErrors | undefined,
  metadataProperties: FormMetadataProperty[]
) => {
  if (!errors) {
    return;
  }

  const relationshipPrimaryNames = buildRelationshipPrimaryNames(metadataProperties);
  const propertyByName = new Map(metadataProperties.map(property => [property.name, property]));
  const appliedPaths = new Set<string>();

  if (errors.title) {
    setError('title', { type: 'server', message: errors.title });
    appliedPaths.add('title');
  }

  if (errors.template) {
    setError('template', { type: 'server', message: errors.template });
    appliedPaths.add('template');
  }

  if (errors.metadata) {
    Object.entries(errors.metadata).forEach(([name, message]) => {
      if (!message) {
        return;
      }

      const property = propertyByName.get(name);
      const path = property
        ? resolveMetadataErrorPath(property, relationshipPrimaryNames)
        : (`metadata.${name}` as Path<EditEntityFormValues>);

      if (appliedPaths.has(path)) {
        return;
      }

      setError(path, { type: 'server', message });
      appliedPaths.add(path);
    });
  }
};

export {
  applyEditEntityErrors,
  buildRelationshipPrimaryNames,
  getFirstEditEntityErrorPath,
  getMetadataFieldPath,
  resolveMetadataErrorPath,
};
export type { EditEntityErrors, EditEntityFormValues };
