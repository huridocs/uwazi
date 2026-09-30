import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import csvtojson from 'csvtojson';

import { shouldKeepEnglish } from './keepEnglish.js';
import type { Finding } from './types.js';

type TranslationContextRow = {
  key: string;
  component: string;
  view: string;
  context: string;
  doNotTranslate: boolean;
};

const CONTEXT_HEADER = 'Key,Component,View,Context,DoNotTranslate';

const SETTINGS_VIEW_BY_FOLDER: Record<string, string> = {
  Account: 'Settings > Account',
  ActivityLog: 'Settings > Activity Log',
  CSVUpload: 'Settings > Import CSV',
  Collection: 'Settings > Collection',
  CustomUploads: 'Settings > Uploads',
  Customization: 'Settings > Theme and branding',
  Dashboard: 'Settings > Dashboard',
  Dataviz: 'Settings > Data Visualizations',
  Filters: 'Settings > Filters',
  IX: 'Settings > Metadata extraction',
  Languages: 'Settings > Languages',
  MenuConfig: 'Settings > Menu',
  Pages: 'Settings > Pages',
  ParagraphExtraction: 'Settings > Paragraph Extraction',
  Preserve: 'Settings > Preserve',
  RelationshipTypes: 'Settings > Relationship Types',
  Templates: 'Settings > Templates',
  Thesauri: 'Settings > Thesauri',
  Translations: 'Settings > Translations',
  Users: 'Settings > Users & Groups',
};

const COMPONENT_BY_KIND: Partial<Record<Finding['kind'], TranslationContextRow['component']>> = {
  'untranslated-notify': 'Toast notification',
  'untranslated-label': 'Option label',
};

const csvCell = (value: string): string => {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

const isTruthyFlag = (value: string | undefined): boolean =>
  ['true', '1', 'yes'].includes((value ?? '').trim().toLowerCase());

const inferComponent = (finding: Finding): string => {
  if (finding.kind === 'untranslated-attribute' && finding.attrName === 'placeholder') {
    return 'Placeholder';
  }
  if (finding.kind === 'untranslated-attribute') {
    return 'Accessible label';
  }
  return COMPONENT_BY_KIND[finding.kind] ?? 'UI text';
};

const posixPath = (file: string): string => file.replaceAll('\\', '/');

const inferSettingsView = (file: string): string | undefined => {
  const match = posixPath(file).match(/\/Routes\/Settings\/([^/]+)/);
  return match ? SETTINGS_VIEW_BY_FOLDER[match[1]] : undefined;
};

const inferView = (file: string): string => {
  const normalized = posixPath(file);
  const settingsView = inferSettingsView(normalized);
  if (settingsView) {
    return settingsView;
  }
  if (/\/Routes\/Library\/|\/Library\//.test(normalized)) {
    return 'Library';
  }
  if (/\/Routes\/Entity\/|\/Viewer\/|\/Entities\//.test(normalized)) {
    return 'Entity view';
  }
  return 'Unresolved';
};

const toContextRow = (raw: Record<string, string>): TranslationContextRow => ({
  key: raw.key ?? raw.Key ?? '',
  component: raw.component ?? raw.Component ?? '',
  view: raw.view ?? raw.View ?? '',
  context: raw.context ?? raw.Context ?? '',
  doNotTranslate: isTruthyFlag(raw.doNotTranslate ?? raw.DoNotTranslate),
});

const loadTranslationContext = async (file: string): Promise<TranslationContextRow[]> => {
  const content = await readFile(file, 'utf8');
  const rows: Record<string, string>[] = await csvtojson({
    delimiter: [',', ';'],
    quote: '"',
  }).fromString(content);
  return rows.map(toContextRow).filter(row => row.key && row.key !== 'Key');
};

const contextLine = (row: TranslationContextRow): string =>
  [
    csvCell(row.key),
    csvCell(row.component),
    csvCell(row.view),
    csvCell(row.context),
    row.doNotTranslate ? 'true' : 'false',
  ].join(',');

const withDoNotTranslateHeader = (content: string): string => {
  const lines = content.split(/\r?\n/);
  const header = lines[0]?.replace(/^\uFEFF/, '') ?? '';
  if (header.startsWith('Key,Component,View,Context')) {
    lines[0] = CONTEXT_HEADER;
  }
  return lines.join('\n');
};

const relativeToCwd = (file: string, cwd: string): string => {
  const rel = path.relative(cwd, file);
  return rel.startsWith('..') ? file : rel;
};

const stubFromFinding = (finding: Finding, relativeFile: string): TranslationContextRow => {
  const component = inferComponent(finding);
  const view = inferView(finding.file);
  return {
    key: finding.key,
    component,
    view,
    context: `Used in ${relativeFile}. Replace this stub with a one-line meaning before translating.`,
    doNotTranslate: shouldKeepEnglish({ key: finding.key, component }),
  };
};

const stubsForAddedKeys = (
  findings: Finding[],
  keys: string[],
  cwd: string
): TranslationContextRow[] => {
  const wanted = new Set(keys);
  const seen = new Set<string>();
  return findings.flatMap(finding => {
    if (!wanted.has(finding.key) || seen.has(finding.key)) {
      return [];
    }
    seen.add(finding.key);
    return [stubFromFinding(finding, relativeToCwd(finding.file, cwd))];
  });
};

const loadContextOrEmpty = async (file: string): Promise<TranslationContextRow[]> => {
  try {
    return await loadTranslationContext(file);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
};

const existingContextBody = async (
  file: string,
  existing: TranslationContextRow[]
): Promise<string> => {
  if (!existing.length) {
    return CONTEXT_HEADER;
  }
  return withDoNotTranslateHeader(await readFile(file, 'utf8')).replace(/\s+$/, '');
};

const addContextStubs = async (file: string, stubs: TranslationContextRow[]): Promise<string[]> => {
  const existing = await loadContextOrEmpty(file);
  const existingKeys = new Set(existing.map(row => row.key));
  const added = stubs.filter(stub => stub.key && !existingKeys.has(stub.key));
  if (!added.length) {
    return [];
  }

  await mkdir(path.dirname(file), { recursive: true });
  const current = await existingContextBody(file, existing);
  await writeFile(file, `${current}\n${added.map(contextLine).join('\n')}\n`);
  return added.map(row => row.key);
};

export {
  CONTEXT_HEADER,
  addContextStubs,
  inferComponent,
  inferView,
  loadTranslationContext,
  stubFromFinding,
  stubsForAddedKeys,
};
export type { TranslationContextRow };
