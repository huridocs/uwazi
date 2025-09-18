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

export const sanitizeUrl = (url: string): string => {
  return sanitizeHtml(url, {
    allowedTags: [],
    allowedAttributes: {},
  });
};

export const validateAndSanitizeUrl = (url: string): { url: string; isValid: boolean } => {
  const sanitized = sanitizeUrl(url);
  const isValid = isValidUrl(sanitized);
  return { url: sanitized, isValid };
};
