import { MetadataObjectSchema } from 'shared/types/commonTypes';

export interface SanitizationWarning {
  property: string;
  value: string;
  reason: string;
}

export interface SanitizationResult {
  value: string;
  warnings: SanitizationWarning[];
}

import { sanitizeThesaurusLabel } from 'shared/sanitizationUtils';

export const sanitizeText = sanitizeThesaurusLabel;

export const sanitizeStringValue = (value: string, propertyName: string): SanitizationResult => {
  const warnings: SanitizationWarning[] = [];
  let sanitizedValue = value;

  const originalValue = value;
  const basicSanitized = sanitizeText(value);

  if (basicSanitized !== value) {
    const trimmed = value.trim();
    if (trimmed !== value) {
      warnings.push({
        property: propertyName,
        value: originalValue,
        reason: 'Leading/trailing whitespace removed',
      });
    }

    const spaceNormalized = value.replace(/\s+/g, ' ');
    if (spaceNormalized !== value) {
      warnings.push({
        property: propertyName,
        value: originalValue,
        reason: 'Multiple spaces normalized to single space',
      });
    }

    sanitizedValue = basicSanitized;
  }

  const emptyPatterns = [
    'null',
    'NULL',
    'Null',
    'undefined',
    'UNDEFINED',
    'Undefined',
    'N/A',
    'n/a',
    'N/a',
  ];
  if (emptyPatterns.includes(sanitizedValue)) {
    warnings.push({
      property: propertyName,
      value: originalValue,
      reason: 'Empty value pattern normalized to empty string',
    });
    sanitizedValue = '';
  }

  return {
    value: sanitizedValue,
    warnings,
  };
};

/**
 * Sanitizes metadata values for CSV import, applying string sanitization
 * to text-based property types and handling empty values appropriately.
 */
export const sanitizeMetadataValue = (
  value: any,
  propertyName: string,
  propertyType: string
): SanitizationResult => {
  // Handle null/undefined values
  if (value === null || value === undefined) {
    return {
      value: '',
      warnings: [
        {
          property: propertyName,
          value: String(value),
          reason: 'Null/undefined value converted to empty string',
        },
      ],
    };
  }

  const stringValue = String(value);

  const textBasedTypes = ['text', 'preview', 'image', 'media', 'nested', 'link'];

  if (textBasedTypes.includes(propertyType)) {
    return sanitizeStringValue(stringValue, propertyName);
  }

  return {
    value: stringValue,
    warnings: [],
  };
};

/**
 * Sanitizes an array of metadata objects, applying sanitization to each value
 * and collecting all warnings.
 */
export const sanitizeMetadataArray = (
  metadataArray: MetadataObjectSchema[],
  propertyName: string,
  propertyType: string
): { sanitizedArray: MetadataObjectSchema[]; warnings: SanitizationWarning[] } => {
  const warnings: SanitizationWarning[] = [];
  const sanitizedArray: MetadataObjectSchema[] = [];

  metadataArray.forEach(metadata => {
    if (metadata.value !== undefined && metadata.value !== null) {
      const sanitizationResult = sanitizeMetadataValue(metadata.value, propertyName, propertyType);

      warnings.push(...sanitizationResult.warnings);

      // Only include the metadata if it has a meaningful value after sanitization
      if (sanitizationResult.value !== '') {
        sanitizedArray.push({
          ...metadata,
          value: sanitizationResult.value,
        });
      }
    }
  });

  return { sanitizedArray, warnings };
};
