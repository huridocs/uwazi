const NATIVE_TRANSLATABLE_ATTRS = new Set([
  'aria-label',
  'aria-valuetext',
  'aria-placeholder',
  'placeholder',
  'alt',
]);

const COMPONENT_ARIA_ATTRS = new Set([
  ...NATIVE_TRANSLATABLE_ATTRS,
  'ariaLabel',
  'listAriaLabel',
  'tabListAriaLabel',
  'removeAriaLabel',
]);

const ENTITY_ISH_PROPS = new Set([
  'sharedId',
  'template',
  '_id',
  'entity',
  'filename',
  'originalname',
]);

const OPTION_ID_PROPS = new Set(['value', 'id', 'key', 'sortKey', 'type']);

const ALWAYS_UI_OBJECT_PROPS = new Set([
  'label',
  'emptyMessage',
  'placeholder',
  'ariaLabel',
  'statusLabel',
  'flashTypeLabel',
]);

const OPTION_ONLY_UI_PROPS = new Set(['title', 'header']);

const SAFE_CALL_CALLEES = new Set(['confirm']);
const SAFE_OBJECT_WRAPPERS = new Set(['ConfirmationModal', 'Confirm']);
const SAFE_TITLE_COMPONENTS = new Set([
  'SettingsContent',
  'SettingsHeaderTitle',
  'ConfirmationModal',
  'Confirm',
]);
const SAFE_LABEL_COMPONENTS = new Set([
  'Checkbox',
  'RadioSelect',
  'InputColorPicker',
  'Label',
  'MultiSelect',
  'ConfirmationModal',
  'Confirm',
]);
const NOTIFY_CALLEES = new Set(['notify', 'notifyBridge']);

const LETTER_RE = /[A-Za-z]/;
const DATE_FORMAT_RE = /^[dmyY0-9./\s:-]+$/;
const URL_OR_PATH_RE = /^(https?:|s3:|\/|\.{1,2}\/)/;
const COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const IDENTIFIER_LIKE_RE = /^[a-z][a-zA-Z0-9]*$/;
const ALL_CAPS_TOKEN_RE = /^[A-Z0-9]{2,}$/;

const COMPOSED_PLACEHOLDER = `\${...}`;

const normalizeKey = (text: string): string => text.trim().replace(/\n\s*/g, ' ');

const looksLikeUiCopy = (text: string): boolean => {
  const trimmed = text.trim();
  const withoutEntities = trimmed.replace(/&[a-zA-Z]+;/g, '');
  if (!withoutEntities || !LETTER_RE.test(withoutEntities)) {
    return false;
  }
  if (DATE_FORMAT_RE.test(trimmed) && /[dmy]/i.test(trimmed) && /[./-]/.test(trimmed)) {
    return false;
  }
  if (URL_OR_PATH_RE.test(trimmed) || COLOR_RE.test(trimmed)) {
    return false;
  }
  return true;
};

const looksLikeChromeCopy = (text: string): boolean => {
  if (!looksLikeUiCopy(text)) {
    return false;
  }
  const trimmed = text.trim();
  return !IDENTIFIER_LIKE_RE.test(trimmed) && !ALL_CAPS_TOKEN_RE.test(trimmed);
};

const isReactUiFile = (file: string): boolean =>
  /(?:^|\/)app\/react\//.test(file.replaceAll('\\', '/'));

export {
  ALWAYS_UI_OBJECT_PROPS,
  COMPOSED_PLACEHOLDER,
  COMPONENT_ARIA_ATTRS,
  ENTITY_ISH_PROPS,
  NATIVE_TRANSLATABLE_ATTRS,
  NOTIFY_CALLEES,
  OPTION_ID_PROPS,
  OPTION_ONLY_UI_PROPS,
  SAFE_CALL_CALLEES,
  SAFE_LABEL_COMPONENTS,
  SAFE_OBJECT_WRAPPERS,
  SAFE_TITLE_COMPONENTS,
  isReactUiFile,
  looksLikeChromeCopy,
  looksLikeUiCopy,
  normalizeKey,
};
