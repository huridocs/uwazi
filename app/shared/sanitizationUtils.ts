/**
 * Shared sanitization utilities for thesaurus values and labels.
 */
export interface SanitizationWarning {
  property: string;
  value: string;
  reason: string;
}

export interface SanitizationResult {
  value: string;
  warnings: SanitizationWarning[];
}

/**
 * Sanitizes a thesaurus label by trimming whitespace and normalizing spaces.
 * @param label - The label to sanitize
 * @returns The sanitized label
 */
export const sanitizeThesaurusLabel = (label: string): string => {
  if (!label) return '';

  return label
    .replace(/(\n|\r)/g, ' ') // Replace newlines with spaces
    .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
    .trim(); // Trim leading/trailing whitespace
};

/**
 * Sanitizes a thesaurus name by applying the same sanitization as labels.
 *
 * @param name - The thesaurus name to sanitize
 * @returns The sanitized name
 */
export const sanitizeThesaurusName = (name: string): string => {
  return sanitizeThesaurusLabel(name);
};

/**
 * Sanitizes a text value with detailed warnings about what was changed.
 * This is used for CSV import and other scenarios where detailed feedback is needed.
 *
 * @param value - The value to sanitize
 * @param propertyName - The name of the property being sanitized (for warnings)
 * @returns Object containing sanitized value and warnings
 */
export const sanitizeStringValue = (value: string, propertyName: string): SanitizationResult => {
  const warnings: SanitizationWarning[] = [];
  let sanitizedValue = value;
  const originalValue = value;
  const basicSanitized = sanitizeThesaurusLabel(value);

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
 * Legacy alias for backward compatibility.
 * @deprecated Use sanitizeThesaurusLabel instead
 */
export const sanitizeText = sanitizeThesaurusLabel;
