import sanitizeHtml from 'sanitize-html';

export const isValidUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

export const isValidUrlLength = (url: string): boolean => {
  // Minimum length for a valid HTTP URL (e.g., "https://a.co")
  const MIN_LENGTH = 10;
  // Maximum reasonable length for a URL (2048 characters is a common browser limit)
  const MAX_LENGTH = 2048;

  return url.length >= MIN_LENGTH && url.length <= MAX_LENGTH;
};

export const sanitizeUrl = (url: string): string => {
  return sanitizeHtml(url, {
    allowedTags: [],
    allowedAttributes: {},
  });
};

export const validateAndSanitizeUrl = (url: string): { url: string; isValid: boolean } => {
  const sanitized = sanitizeUrl(url);
  const isValid = isValidUrl(sanitized) && isValidUrlLength(sanitized);
  return { url: sanitized, isValid };
};
