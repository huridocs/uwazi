import moment from 'moment';
import { RawEntity } from 'api/csv/entityRow';
import { normalizeThesaurusLabel } from 'api/thesauri/thesauri';
import { MetadataObjectSchema, PropertySchema } from 'shared/types/commonTypes';
import { ensure } from 'shared/tsUtils';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import {
  sanitizeMetadataValue,
  SanitizationWarning,
  sanitizeStringValue,
} from '../sanitizationUtils';
import { csvConstants } from '../csvDefinitions';

export interface ParserResult {
  data: MetadataObjectSchema[];
  warnings: SanitizationWarning[];
}
export type LabelInfoBase = {
  label: string;
  normalizedLabel: string;
};

export type LabelInfo = LabelInfoBase & {
  child: LabelInfoBase | null;
};

export const extractAndSanitizeValue = (
  entityToImport: RawEntity,
  property: PropertySchema
): { rawValue: any; sanitizationResult: { value: string; warnings: SanitizationWarning[] } } => {
  const rawValue = entityToImport.propertiesFromColumns[ensure<string>(property.name)];
  const sanitizationResult = sanitizeMetadataValue(
    rawValue,
    ensure<string>(property.name),
    property.type
  );

  return { rawValue, sanitizationResult };
};

export const handleEmptyValue = (sanitizationResult: {
  value: string;
  warnings: SanitizationWarning[];
}): ParserResult => {
  return {
    data: [],
    warnings: sanitizationResult.warnings,
  };
};

export const createSuccessResult = (
  data: MetadataObjectSchema[],
  warnings: SanitizationWarning[]
): ParserResult => {
  return { data, warnings };
};

export const splitLabel = (
  label: string
): { split: string[]; normalizedSplit: string[] } | null => {
  const normalizedLabel = normalizeThesaurusLabel(label);
  if (!normalizedLabel) return null;
  const split = label.split(csvConstants.dictionaryParentChildSeparator);
  const normalizedSplit = normalizedLabel.split(csvConstants.dictionaryParentChildSeparator);
  if (split.length > 2) {
    return null;
  }
  return { split, normalizedSplit };
};

/**
 * Extracts parent and child information from split labels.
 * This is used by both select and multiselect parsers.
 */
export const pickParentChild = (
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

/**
 * Determines parent-child relationship from a label string.
 * This is used by select, multiselect, and arrangeThesauri.
 */
export const determineParentChildRelationship = (label: string): LabelInfo | null => {
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

/**
 * Parses parent-child relationships using the ::separator.
 * This is used by select.ts, multiselect.ts, and arrangeThesauri.ts.
 */
export const parseParentChildWithSpaces = (value: string): LabelInfo | null => {
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

/**
 * Parses a date value using multiple allowed formats.
 * This is used by date, multidate, daterange, and multidaterange parsers.
 */
export const parseDateValue = (dateValue: string, dateFormat: string) => {
  const allowedFormats = [
    dateFormat.toUpperCase(),
    'LL, YYYY MM DD',
    'YYYY/MM/DD',
    'YYYY-MM-DD',
    'YYYY',
  ];

  return moment.utc(dateValue, allowedFormats).unix();
};

/**
 * Parses a single date value.
 * This is used by date and multidate parsers.
 */
export const parseDate = (dateValue: string, dateFormat: string) => ({
  value: parseDateValue(dateValue, dateFormat),
});

/**
 * Parses a date range value.
 * This is used by daterange and multidaterange parsers.
 */
export const parseDateRange = (rangeValue: string, dateFormat: string) => {
  const [from, to] = rangeValue.split(csvConstants.dateRangeImportSeparator);

  return {
    value: {
      from: from !== '' ? parseDateValue(from, dateFormat) : null,
      to: to !== '' ? parseDateValue(to, dateFormat) : null,
    },
  };
};

/**
 * Splits multi-value strings and filters out empty values.
 * This is used by multidate, multidaterange, and other multi-value parsers.
 */
export const parseMultiValue = (values: string) =>
  values.split(csvConstants.multiValueSeparator).filter(value => value !== '');

/**
 * Creates a standardized parser function for simple text-based types.
 * This eliminates the repetitive pattern found in multiple parsers.
 */
export const createStandardParser = (): ((
  entityToImport: RawEntity,
  property: PropertySchema
) => Promise<ParserResult>) => {
  return async (entityToImport: RawEntity, property: PropertySchema): Promise<ParserResult> => {
    const { sanitizationResult } = extractAndSanitizeValue(entityToImport, property);

    if (sanitizationResult.value === '') {
      return handleEmptyValue(sanitizationResult);
    }

    return createSuccessResult([{ value: sanitizationResult.value }], sanitizationResult.warnings);
  };
};

export const generateMetadataValue = (
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

export function splitMultiselectLabels(labelString: string): {
  labelInfos: LabelInfo[];
  parsingFailures: string[];
} {
  if (!labelString) {
    return { labelInfos: [], parsingFailures: [] };
  }
  const labels = labelString
    .split(csvConstants.multiValueSeparator)
    .map(l => l.trim())
    .filter(l => l.length > 0);
  const labelInfos: LabelInfo[] = [];
  const parsingFailures: string[] = [];

  labels.forEach(label => {
    let labelInfo = determineParentChildRelationship(label);

    if (!labelInfo) {
      const sanitizedValue = sanitizeStringValue(label, 'multiselect').value;
      labelInfo = determineParentChildRelationship(sanitizedValue);
    }

    if (!labelInfo) {
      labelInfo = parseParentChildWithSpaces(label);
    }

    if (labelInfo) {
      labelInfos.push(labelInfo);
    } else {
      parsingFailures.push(label);
    }
  });

  return { labelInfos, parsingFailures };
}

export function normalizeMultiselectLabels(labelArray: string[]): string[] {
  function labelNotNull(label: string | null): label is string {
    return label !== null;
  }
  const normalizedLabels = labelArray.map(l => l && l.trim()).filter(labelNotNull);
  return Array.from(new Set(normalizedLabels));
}
