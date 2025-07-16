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

export const sanitizeText = (value: string): string => {
  if (!value) return '';

  return value
    .replace(/(\n|\r)/g, ' ') // Replace newlines with spaces
    .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
    .trim(); // Trim leading/trailing whitespace
};

export const sanitizeStringValue = (value: string, propertyName: string): SanitizationResult => {
  const warnings: SanitizationWarning[] = [];
  let sanitizedValue = value;

  // Store original value for comparison
  const originalValue = value;

  // Apply basic text sanitization first
  const basicSanitized = sanitizeText(value);

  // Check if basic sanitization made changes
  if (basicSanitized !== value) {
    // Determine which specific sanitizations were applied
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

  // 2. Empty string normalization
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

  // Convert to string for sanitization
  const stringValue = String(value);

  // Apply string sanitization for text-based types
  const textBasedTypes = ['text', 'preview', 'image', 'media', 'nested', 'link'];

  if (textBasedTypes.includes(propertyType)) {
    return sanitizeStringValue(stringValue, propertyName);
  }

  // For non-text types, just return the original value without warnings
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

  for (const metadata of metadataArray) {
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
  }

  return { sanitizedArray, warnings };
};
