import thesauri from 'api/thesauri';
import { RawEntity } from 'api/csv/entityRow';
import { normalizeThesaurusLabel } from 'api/thesauri/thesauri';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import { MetadataObjectSchema, PropertySchema } from 'shared/types/commonTypes';
import { ensure } from 'shared/tsUtils';
import { csvConstants } from '../csvDefinitions';
import { TypeParserError } from './errors';
import { sanitizeStringValue } from '../sanitizationUtils';

type LabelInfoBase = {
  label: string;
  normalizedLabel: string;
};

type LabelInfo = LabelInfoBase & {
  child: LabelInfoBase | null;
};

type ParserResult = {
  data: MetadataObjectSchema[];
  warnings: Array<{ property: string; value: string; reason: string }>;
};

const splitLabel = (
  label: string
): {
  split: string[];
  normalizedSplit: string[];
} | null => {
  const normalizedLabel = normalizeThesaurusLabel(label);
  if (!normalizedLabel) return null;
  const split = label.split(csvConstants.dictionaryParentChildSeparator);
  const normalizedSplit = normalizedLabel.split(csvConstants.dictionaryParentChildSeparator);
  if (split.length > 2) {
    return null;
  }
  return { split, normalizedSplit };
};

const pickParentChild = (
  split: string[],
  normalizedSplit: string[]
): {
  parent: string;
  child: string | null;
  normalizedParent: string;
  normalizedChild: string | null;
} => {
  const [parent, child] = split.length === 2 ? split : [split[0], null];
  const [normalizedParent, normalizedChild] =
    normalizedSplit.length === 2 ? normalizedSplit : [normalizedSplit[0], null];
  return { parent, child, normalizedParent, normalizedChild };
};

const determineParentChildRelationship = (label: string): LabelInfo | null => {
  const splitLabelResult = splitLabel(label);
  if (!splitLabelResult) return null;
  const { split, normalizedSplit } = splitLabelResult;
  const { parent, child, normalizedParent, normalizedChild } = pickParentChild(
    split,
    normalizedSplit
  );

  const parentEndsWithSpace = parent && parent.trim() !== parent;
  const childEndsWithSpace = child && child.trim() !== child;

  if (parentEndsWithSpace || childEndsWithSpace) {
    return null;
  }

  return {
    label: parent,
    normalizedLabel: normalizedParent,
    child: child && normalizedChild ? { label: child, normalizedLabel: normalizedChild } : null,
  };
};

const generateMetadataValue = (
  currentThesaurus: ThesaurusSchema,
  labelInfo: LabelInfo
): MetadataObjectSchema | null => {
  const parent = currentThesaurus.values?.find(
    v => normalizeThesaurusLabel(v.label) === labelInfo.normalizedLabel
  );
  
  if (!parent || !parent.id) {
    return null;
  }
  
  if (labelInfo.child) {
    const child = parent?.values?.find(
      v => normalizeThesaurusLabel(v.label) === labelInfo.child?.normalizedLabel
    );

    if (!child || !child.id) {
      return null;
    }

    return {
      value: child.id,
      label: child.label,
      parent: {
        value: parent.id,
        label: parent.label,
      },
    };
  }

  return {
    value: parent.id,
    label: parent.label,
  };
};

const parseParentChildWithSpaces = (value: string): LabelInfo | null => {
  if (!value) return null;

  const separator = '::';
  const parts = value.split(separator);

  if (parts.length > 2) {
    return null;
  }

  if (parts.length === 1) {
    const trimmedLabel = parts[0].trim();
    const normalizedLabel = normalizeThesaurusLabel(trimmedLabel);
    if (!normalizedLabel) return null;

    return {
      label: trimmedLabel,
      normalizedLabel,
      child: null,
    };
  }

  const parentLabel = parts[0].trim();
  const childLabel = parts[1].trim();

  const normalizedParentLabel = normalizeThesaurusLabel(parentLabel);
  const normalizedChildLabel = normalizeThesaurusLabel(childLabel);

  if (!normalizedParentLabel || !normalizedChildLabel) {
    return null;
  }

  return {
    label: parentLabel,
    normalizedLabel: normalizedParentLabel,
    child: {
      label: childLabel,
      normalizedLabel: normalizedChildLabel,
    },
  };
};

const select = async (
  entityToImport: RawEntity,
  property: PropertySchema
): Promise<ParserResult> => {
  const currentThesauri = (await thesauri.getById(property.content)) || ({} as ThesaurusSchema);
  const propValue = entityToImport.propertiesFromColumns[ensure<string>(property.name)];
  const warnings: Array<{ property: string; value: string; reason: string }> = [];

  if (!propValue) {
    return { data: [], warnings: [] };
  }

  let labelInfo = determineParentChildRelationship(propValue);

  if (!labelInfo && propValue) {
    const sanitizedValue = sanitizeStringValue(propValue, property.name).value;
    labelInfo = determineParentChildRelationship(sanitizedValue);
  }

  if (!labelInfo && propValue) {
    labelInfo = parseParentChildWithSpaces(propValue);
  }

  if (!labelInfo) {
    warnings.push({
      property: property.name,
      value: propValue,
      reason: 'Invalid thesaurus value format',
    });
    return { data: [], warnings };
  }

  const value = generateMetadataValue(currentThesauri, labelInfo);
  
  if (!value || value.value === undefined || value.value === null) {
    warnings.push({
      property: property.name,
      value: propValue,
      reason: 'Thesaurus value not found',
    });
    return { data: [], warnings };
  }

  return { data: [value], warnings };
};

export default select;
export type { LabelInfo, LabelInfoBase };
export { determineParentChildRelationship, generateMetadataValue };
