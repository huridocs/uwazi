const MAIN_TAB = {
  DOCUMENT: 'document',
  METADATA: 'metadata',
  RELATIONSHIPS: 'relationships',
  FILES: 'files',
} as const;

const SIDE_TAB = {
  DOCUMENT: 'document',
  METADATA: 'metadata',
  TOC: 'toc',
  RELATIONSHIPS: 'relationships',
  SEARCH: 'search',
  FILE: 'file',
  TRANSLATIONS: 'translations',
} as const;

type MainTabId = (typeof MAIN_TAB)[keyof typeof MAIN_TAB];
type SideTabId = (typeof SIDE_TAB)[keyof typeof SIDE_TAB];

const MAIN_TAB_VALUES = new Set<string>(Object.values(MAIN_TAB));
const SIDE_TAB_VALUES = new Set<string>(Object.values(SIDE_TAB));

const isValidMainTab = (value: string | null | undefined): value is MainTabId =>
  typeof value === 'string' && MAIN_TAB_VALUES.has(value);

const isValidSideTab = (value: string | null | undefined): value is SideTabId =>
  typeof value === 'string' && SIDE_TAB_VALUES.has(value);

export { MAIN_TAB, SIDE_TAB, isValidMainTab, isValidSideTab };
export type { MainTabId, SideTabId };
