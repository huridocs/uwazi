import type { Path, UseFormSetError } from 'react-hook-form';
import type { ApiValidation } from '#shared/apiClient/index.js';
import type { EditEntityFormValues } from './buildEditEntityDefaultValues.js';
import { metadataFormPath, type FormMetadataProperty } from './formatMetadataForForm.js';
import { relationshipMemberKey } from '../../relationshipInherit.js';

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

const MESSAGE_TYPES: { pattern: RegExp; types: FormMetadataProperty['type'][] }[] = [
  { pattern: /Multi Date Range Property/, types: ['multidaterange'] },
  { pattern: /Multi Date Property/, types: ['multidate'] },
  { pattern: /Date Range Property/, types: ['daterange'] },
  { pattern: /Date Property/, types: ['date'] },
  { pattern: /Generated ID Property/, types: ['generatedid'] },
  { pattern: /Geolocation Property/, types: ['geolocation'] },
  { pattern: /Relationship Property/, types: ['relationship'] },
  { pattern: /Markdown Property/, types: ['markdown'] },
  { pattern: /Numeric Property/, types: ['numeric'] },
  { pattern: /Nested Property/, types: ['nested'] },
  { pattern: /Image Property/, types: ['image'] },
  { pattern: /Media Property/, types: ['media'] },
  { pattern: /Link Property/, types: ['link'] },
  { pattern: /Text Property/, types: ['text'] },
  { pattern: /Select\/MultiSelect|Parent (value|label)/, types: ['select', 'multiselect'] },
];

const handledPropertyMessage = (message: string) => {
  if (message.includes('valid URL')) return 'Invalid URL';
  if (/required|must be provided|non-empty/i.test(message)) return 'This field is required';
  return message;
};

const propertyNamesForMessage = (
  instancePath: string,
  message: string,
  properties?: FormMetadataProperty[]
) => {
  const fromPath = parseMetadataPropertyName(instancePath);
  if (fromPath) return [fromPath];
  if (!properties?.length) return [];

  const match = MESSAGE_TYPES.find(entry => entry.pattern.test(message));
  if (!match) return [];

  const names = properties
    .filter(property => match.types.includes(property.type))
    .map(property => property.name);
  return names.length === 1 ? names : [];
};

const setIfEmpty = (target: Record<string, string>, key: string, message: string) => {
  if (!target[key]) target[key] = message;
};

const applyRootValidation = (errors: EditEntityErrors, instancePath: string, message: string) => {
  if (instancePath === '.title' || instancePath === '/title') {
    if (!errors.title) errors.title = message;
    return true;
  }
  if (instancePath === '.template' || instancePath === '/template') {
    if (!errors.template) errors.template = message;
    return true;
  }
  return false;
};

const remember = (target: Record<string, string>, key: string, message: string) => {
  setIfEmpty(target, key, message);
  return true;
};

const applyValidation = ({
  errors,
  metadata,
  instancePath,
  message,
  metadataProperties,
}: {
  errors: EditEntityErrors;
  metadata: Record<string, string>;
  instancePath: string;
  message: string;
  metadataProperties?: FormMetadataProperty[];
}) => {
  if (applyRootValidation(errors, instancePath, message)) return true;
  const translationProperty = instancePath.match(/^\/translations\/[^/]+\/([^/]+)/)?.[1];
  if (translationProperty === 'title') {
    if (!errors.title) errors.title = message;
    return true;
  }
  if (translationProperty)
    return remember(metadata, translationProperty, handledPropertyMessage(message));
  const propertyNames = propertyNamesForMessage(instancePath, message, metadataProperties);
  if (!propertyNames.length) return false;
  propertyNames.forEach(name => setIfEmpty(metadata, name, handledPropertyMessage(message)));
  return true;
};

const apiValidationsToEditEntityErrors = (
  validations: ApiValidation[] | undefined,
  metadataProperties?: FormMetadataProperty[]
): EditEntityErrors | undefined => {
  if (!validations?.length) return undefined;

  const errors: EditEntityErrors = {};
  const metadata: Record<string, string> = {};

  validations.forEach(({ instancePath, message }) => {
    if (message) applyValidation({ errors, metadata, instancePath, message, metadataProperties });
  });

  if (Object.keys(metadata).length > 0) errors.metadata = metadata;
  if (!errors.title && !errors.template && !errors.metadata) return undefined;

  return errors;
};

const buildRelationshipPrimaryNames = (properties: FormMetadataProperty[]) => {
  const primaryByPropertyName = new Map<string, string>();
  const primaryByGroupKey = new Map<string, string>();

  properties.forEach(property => {
    if (property.type !== 'relationship') {
      return;
    }

    const groupKey = relationshipMemberKey(property, property.name);
    const primaryName = primaryByGroupKey.get(groupKey) ?? property.name;

    if (!primaryByGroupKey.has(groupKey)) {
      primaryByGroupKey.set(groupKey, property.name);
    }

    primaryByPropertyName.set(property.name, primaryName);
  });

  return primaryByPropertyName;
};

const getMetadataFieldPath = (property: FormMetadataProperty): Path<EditEntityFormValues> => {
  const path = metadataFormPath(property.name);
  switch (property.type) {
    case 'select':
    case 'multiselect':
    case 'relationship':
    case 'nested':
    case 'multidate':
    case 'multidaterange':
    case 'geolocation':
      return path;
    default:
      return `${path}.0.value`;
  }
};

const resolveMetadataErrorPath = (
  property: FormMetadataProperty,
  relationshipPrimaryNames: Map<string, string>
): Path<EditEntityFormValues> => {
  if (property.type === 'relationship') {
    const primaryName = relationshipPrimaryNames.get(property.name) ?? property.name;
    return metadataFormPath(primaryName);
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
  return unknownEntry ? metadataFormPath(unknownEntry[0]) : undefined;
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

const applyScalarEditEntityError = ({
  setError,
  path,
  message,
  appliedPaths,
}: {
  setError: UseFormSetError<EditEntityFormValues>;
  path: 'title' | 'template';
  message: string | undefined;
  appliedPaths: Set<string>;
}) => {
  if (!message) return;

  setError(path, { type: 'server', message });
  appliedPaths.add(path);
};

const applyMetadataEditEntityErrors = ({
  setError,
  metadataErrors,
  metadataProperties,
  appliedPaths,
}: {
  setError: UseFormSetError<EditEntityFormValues>;
  metadataErrors: Record<string, string | undefined>;
  metadataProperties: FormMetadataProperty[];
  appliedPaths: Set<string>;
}) => {
  const relationshipPrimaryNames = buildRelationshipPrimaryNames(metadataProperties);
  const propertyByName = new Map(metadataProperties.map(property => [property.name, property]));

  Object.entries(metadataErrors).forEach(([name, message]) => {
    if (!message) return;

    const property = propertyByName.get(name);
    const path = property
      ? resolveMetadataErrorPath(property, relationshipPrimaryNames)
      : metadataFormPath(name);

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

  applyScalarEditEntityError({ setError, path: 'title', message: errors.title, appliedPaths });
  applyScalarEditEntityError({
    setError,
    path: 'template',
    message: errors.template,
    appliedPaths,
  });

  if (errors.metadata) {
    applyMetadataEditEntityErrors({
      setError,
      metadataErrors: errors.metadata,
      metadataProperties,
      appliedPaths,
    });
  }
};

export {
  apiValidationsToEditEntityErrors,
  applyValidation,
  applyEditEntityErrors,
  getFirstEditEntityErrorPath,
  getMetadataFieldPath,
  resolveMetadataErrorPath,
};
export type { EditEntityErrors };
