const KEEP_ENGLISH_KEYS = new Set([
  '2FA',
  'A → Z',
  'AND OR NOT',
  'API',
  'Auto',
  'Bert',
  'CSS',
  'CSV',
  'Captcha',
  'Ctrl K',
  'Global JS',
  'Google',
  'Google Analytics',
  'Google Maps',
  'HTML',
  'ID',
  'ID:',
  'JSON',
  'Mapbox',
  'Markdown',
  'Matomo',
  'OCR',
  'PDF',
  'URL',
  'Uwazi',
  'Uwazi Docs',
  'Z → A',
  'https://yourdomain',
  'hub',
  'p.',
  'x',
  'U',
]);

const KEEP_ENGLISH_COMPONENTS = new Set([
  'Code example',
  'Date format example text',
  'Example search query text',
  'Preview brand label',
  'Search tip example',
]);

const SEARCH_SYNTAX_RE = /[*~]|^\d+\?$|^["'].+["']$/;

type KeepEnglishInput = {
  key: string;
  component?: string;
  doNotTranslate?: boolean;
};

const shouldKeepEnglish = ({ key, component, doNotTranslate }: KeepEnglishInput): boolean => {
  if (doNotTranslate) {
    return true;
  }
  if (component && KEEP_ENGLISH_COMPONENTS.has(component)) {
    return true;
  }
  return KEEP_ENGLISH_KEYS.has(key) || SEARCH_SYNTAX_RE.test(key);
};

export { KEEP_ENGLISH_COMPONENTS, KEEP_ENGLISH_KEYS, shouldKeepEnglish };
export type { KeepEnglishInput };
