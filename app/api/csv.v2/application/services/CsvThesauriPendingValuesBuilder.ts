/* eslint-disable max-lines */
import { Template } from 'api/core/domain/template/Template';
import { Property } from 'api/core/domain/template/Property';
import { PropertyName } from 'api/core/domain/template/PropertyName';
import { sanitizeThesaurusLabel } from 'shared/sanitizationUtils';
import { CsvImportRow } from '../../domain/CsvImportRow';
import { HeaderAnalysis } from './CsvHeaderAnalyzer';
import {
  CsvThesauriPendingValues,
  CsvThesauriPendingEntry,
  CsvThesauriPendingIssue,
  CsvThesauriPendingRoot,
  CsvThesauriPendingChild,
} from '../../domain/CsvThesauriPendingValues';

type BuildParams = {
  importId: string;
  rows: CsvImportRow[];
  template: Template;
  headerAnalysis: HeaderAnalysis;
  defaultLanguage: string;
  newNameGeneration: boolean;
};

type BuildResult = {
  pendingValues: CsvThesauriPendingValues;
  issues: CsvThesauriPendingIssue[];
};

type SelectLikeProperty = Property & { content?: string };

type ParsedLabel = {
  root: {
    label: string;
    normalized: string;
  };
  child?: {
    label: string;
    normalized: string;
  };
};

type PendingEntryInternal = {
  entry: CsvThesauriPendingEntry;
  roots: Map<string, PendingRootInternal>;
};

type PendingRootInternal = {
  data: CsvThesauriPendingRoot;
  children: Map<string, CsvThesauriPendingChild>;
};

const MULTIVALUE_SEPARATOR = '|';
const LANGUAGE_SEPARATOR = '__';
const PARENT_CHILD_SEPARATOR = '::';

const normalizeLabel = (label: string) => sanitizeThesaurusLabel(label).toLowerCase();

const sanitizeHeader = (header: string, newNameGeneration: boolean) =>
  PropertyName.fromLabel(header, { newNameGeneration }).value;

const isSelectLikeProperty = (property: Property): property is SelectLikeProperty =>
  (property.type === 'select' || property.type === 'multiselect') &&
  Boolean((property as SelectLikeProperty).content);

const parseRootLabel = (label: string) => {
  const sanitized = sanitizeThesaurusLabel(label);
  const normalized = normalizeLabel(sanitized);
  if (!normalized) {
    return undefined;
  }
  return { label: sanitized, normalized };
};

const parseRootChildLabels = (parent: string, child: string) => {
  const parentInfo = parseRootLabel(parent);
  const childInfo = parseRootLabel(child);
  if (!parentInfo || !childInfo) {
    return undefined;
  }
  return { parentInfo, childInfo };
};

// eslint-disable-next-line max-statements
const parseSingleValue = (value: string): ParsedLabel | undefined => {
  const sanitized = sanitizeThesaurusLabel(value);
  if (!sanitized) {
    return undefined;
  }

  const [parentPart, childPart, ...rest] = sanitized.split(PARENT_CHILD_SEPARATOR);
  if (rest.length > 0) {
    return undefined;
  }

  if (childPart === undefined) {
    const rootOnly = parseRootLabel(parentPart);
    if (!rootOnly) {
      return undefined;
    }
    return { root: rootOnly };
  }

  const parsed = parseRootChildLabels(parentPart, childPart);
  if (!parsed) {
    return undefined;
  }

  return {
    root: parsed.parentInfo,
    child: parsed.childInfo,
  };
};

const splitSegments = (value: string, property: SelectLikeProperty) => {
  if (!value) {
    return [];
  }
  return property.type === 'multiselect'
    ? value
        .split(MULTIVALUE_SEPARATOR)
        .map(item => item.trim())
        .filter(item => item)
    : [value];
};

const parseValues = (rawValue: string, property: SelectLikeProperty) => {
  const labels: ParsedLabel[] = [];
  const errors: string[] = [];

  const segments = splitSegments(rawValue, property);
  segments.forEach(segment => {
    const parsed = parseSingleValue(segment);
    if (parsed) {
      labels.push(parsed);
    } else {
      errors.push(segment);
    }
  });

  return { labels, errors };
};

const ensurePendingEntry = (
  property: SelectLikeProperty,
  entries: Map<string, PendingEntryInternal>
): PendingEntryInternal => {
  const existing = entries.get(property.id);
  if (existing) {
    return existing;
  }

  const entry: CsvThesauriPendingEntry = {
    propertyId: property.id,
    propertyName: property.name,
    thesaurusId: (property as SelectLikeProperty).content || '',
    type: property.type === 'multiselect' ? 'multiselect' : 'select',
    roots: [],
  };
  const internal: PendingEntryInternal = {
    entry,
    roots: new Map(),
  };
  entries.set(property.id, internal);
  return internal;
};

const ensureRoot = (
  parent: PendingEntryInternal,
  label: string,
  normalized: string,
  defaultLanguage: string
): PendingRootInternal => {
  const existing = parent.roots.get(normalized);
  if (existing) {
    if (!existing.data.languages[defaultLanguage]) {
      existing.data.languages[defaultLanguage] = label;
    }
    return existing;
  }

  const root: CsvThesauriPendingRoot = {
    label,
    normalized,
    languages: { [defaultLanguage]: label },
    children: [],
  };
  const internal: PendingRootInternal = {
    data: root,
    children: new Map(),
  };
  parent.roots.set(normalized, internal);
  parent.entry.roots.push(root);
  return internal;
};

const ensureChild = (
  parent: PendingRootInternal,
  label: string,
  normalized: string,
  defaultLanguage: string
) => {
  const existing = parent.children.get(normalized);
  if (existing) {
    if (!existing.languages[defaultLanguage]) {
      existing.languages[defaultLanguage] = label;
    }
    return existing;
  }

  const child: CsvThesauriPendingChild = {
    label,
    normalized,
    languages: { [defaultLanguage]: label },
  };
  parent.children.set(normalized, child);
  parent.data.children.push(child);
  return child;
};

export class CsvThesauriPendingValuesBuilder {
  static build(params: BuildParams): BuildResult {
    const { importId, rows, template, headerAnalysis, defaultLanguage, newNameGeneration } = params;
    const pendingEntries = new Map<string, PendingEntryInternal>();
    const issues: CsvThesauriPendingIssue[] = [];

    const properties = template.properties.filter(isSelectLikeProperty) as SelectLikeProperty[];
    if (!properties.length) {
      return {
        pendingValues: CsvThesauriPendingValues.create({
          importId,
          createdAt: Date.now(),
          defaultLanguage,
          entries: [],
        }),
        issues: [],
      };
    }

    rows.forEach(row => {
      const sanitizedHeaders = row.headers.map(header => sanitizeHeader(header, newNameGeneration));
      const rowValues = new Map<string, string>();
      sanitizedHeaders.forEach((header, index) => {
        rowValues.set(header, row.values[index] ?? '');
      });

      // eslint-disable-next-line max-statements
      properties.forEach(property => {
        const headerName = property.name;
        const defaultHeader = headerAnalysis.languagesPerHeader[headerName]
          ? `${headerName}${LANGUAGE_SEPARATOR}${defaultLanguage}`
          : headerName;
        const rawValue = rowValues.get(defaultHeader) || '';
        const { labels, errors } = parseValues(rawValue, property);
        if (errors.length) {
          errors.forEach(value =>
            issues.push({
              property: property.name,
              reason: 'Invalid thesaurus value format',
              value,
              row: row.index,
              type: 'parse',
            })
          );
        }
        if (!labels.length) {
          return;
        }

        const entry = ensurePendingEntry(property, pendingEntries);
        labels.forEach(labelInfo => {
          const root = ensureRoot(
            entry,
            labelInfo.root.label,
            labelInfo.root.normalized,
            defaultLanguage
          );
          if (labelInfo.child) {
            ensureChild(root, labelInfo.child.label, labelInfo.child.normalized, defaultLanguage);
          }
        });

        const languageSet = headerAnalysis.languagesPerHeader[headerName];
        if (languageSet) {
          const languageList = Array.from(languageSet);
          // eslint-disable-next-line max-statements
          languageList.forEach(lang => {
            if (lang === defaultLanguage) {
              return;
            }
            const langHeader = `${headerName}${LANGUAGE_SEPARATOR}${lang}`;
            const langValue = rowValues.get(langHeader) || '';
            const parsed = parseValues(langValue, property);
            if (parsed.errors.length) {
              parsed.errors.forEach(value =>
                issues.push({
                  property: property.name,
                  reason: `Invalid format for language "${lang}"`,
                  value,
                  row: row.index,
                  type: 'parse',
                })
              );
            }
            // eslint-disable-next-line max-statements
            parsed.labels.forEach((labelInfo, index) => {
              const target = labels[index];
              if (!target) {
                issues.push({
                  property: property.name,
                  reason: `Language "${lang}" value does not match default language cardinality`,
                  value: langValue,
                  row: row.index,
                  type: 'translation',
                });
                return;
              }
              const entryRef = pendingEntries.get(property.id);
              const root = entryRef?.roots.get(target.root.normalized);
              if (!root) {
                return;
              }
              if (labelInfo.child && target.child) {
                const child = root.children.get(target.child.normalized);
                if (child) {
                  child.languages[lang] = labelInfo.child.label;
                }
              } else if (!labelInfo.child && !target.child) {
                root.data.languages[lang] = labelInfo.root.label;
              }
            });
            if (parsed.labels.length < labels.length) {
              issues.push({
                property: property.name,
                reason: `Language "${lang}" has fewer values (${parsed.labels.length}) than the default language (${labels.length}).`,
                value: langValue,
                row: row.index,
                type: 'translation',
              });
            }
          });
        }
      });
    });

    const pendingValues = CsvThesauriPendingValues.create({
      importId,
      createdAt: Date.now(),
      defaultLanguage,
      entries: Array.from(pendingEntries.values()).map(entry => entry.entry),
    });

    return { pendingValues, issues };
  }
}
