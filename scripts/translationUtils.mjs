/**
 * Shared utility functions for translation checking scripts
 */

/**
 * Normalize text by removing spaces, quotes, semicolons, and HTML entities
 * Used for content-based matching in React files
 */
export const comparableString = text => text.replaceAll(/['\s;]|&(#39|#x27|quot|rsquo|apos);/g, '');

/**
 * Normalize only HTML entities and quotes, but preserve spaces for exact string matching
 * Used for AST string literal matching to avoid false matches
 */
export const normalizeForStringMatch = text => text.replaceAll(/['"]|&(#39|#x27|quot|rsquo|apos);/g, '');

export const precomputeNormalizedValues = translations => {
    translations.forEach(translation => {
        translation.plainKey = comparableString(translation.key);
        translation.plainValue = comparableString(translation.value);
    });
    return translations;
};

/**
 * Check if a string literal matches a translation (exact or normalized match)
 * Marks the translation as used if a match is found
 */
export const checkStringLiteralMatch = (stringValue, translations) => {
    const normalizedString = normalizeForStringMatch(stringValue);

    translations
        .filter(translation => !translation.used)
        .forEach(translation => {
            // Exact matches (highest priority)
            if (
                translation.key === stringValue ||
                translation.value === stringValue
            ) {
                // eslint-disable-next-line no-param-reassign
                translation.used = true;
            } else {
                // Normalized matches (only for HTML entities/quotes, preserving spaces)
                const normalizedKey = normalizeForStringMatch(translation.key);
                const normalizedValue = normalizeForStringMatch(translation.value);
                if (
                    normalizedKey === normalizedString ||
                    normalizedValue === normalizedString
                ) {
                    // eslint-disable-next-line no-param-reassign
                    translation.used = true;
                }
            }
        });
};

/**
 * Check content-based matching for React files
 * Marks translations as used if they appear in the file content
 */
export const checkContentBasedMatch = (fileContents, translations) => {
    const comparableContent = comparableString(fileContents);

    translations
        .filter(translation => !translation.used)
        .forEach(translation => {
            const normalizedKey = translation.plainKey || comparableString(translation.key);
            const normalizedValue = translation.plainValue || comparableString(translation.value);

            if (
                comparableContent.includes(normalizedKey) ||
                comparableContent.includes(normalizedValue) ||
                comparableContent.includes(translation.key) ||
                comparableContent.includes(translation.value)
            ) {
                // eslint-disable-next-line no-param-reassign
                translation.used = true;
            }
        });
};

