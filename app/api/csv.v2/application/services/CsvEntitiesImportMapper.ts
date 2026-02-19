/* eslint-disable max-lines */
import { Template } from 'api/core/domain/template/Template';
import { Property } from 'api/core/domain/template/Property';
import { PropertyName } from 'api/core/domain/template/PropertyName';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import url from 'url';
import moment from 'moment';
import { normalizeThesaurusLabel } from 'api/thesauri/thesauri';
import { sanitizeThesaurusLabel } from 'shared/sanitizationUtils';
import { SelectProperty } from 'api/core/domain/template/select/SelectProperty';
import { PropertyAssignmentInput } from 'api/core/application/propertyAssignmentCreatorService/PropertyAssignmentCreatorService';
import { V1RelationshipProperty } from 'api/core/domain/template/V1RelationshipProperty';
import { CsvHeaderAnalyzer } from './CsvHeaderAnalyzer';
import { CsvImportThesauriValuesDataSource } from '../contracts/CsvImportThesauriValuesDataSource';
import { CsvImportRelationshipValuesDataSource } from '../contracts/CsvImportRelationshipValuesDataSource';
import { ANY_TEMPLATE_RELATIONSHIP_KEY } from './CsvPreflightRelationshipsService';

type AppliedValueIndex = Map<
  string,
  Map<string, { valueId: string; label: string; parentLabel?: string }>
>;

type MappedAssignment = PropertyAssignmentInput;

type AppliedValueDoc = {
  thesaurusId: string;
  appliedValues?: Array<{ label: string; parentLabel?: string; valueId: string }>;
};

type RelationshipValueIndex = Map<
  string,
  Map<string, { label: string; matches: Array<{ sharedId: string; templateId: string }> }>
>;

const sanitizeHeaders = (headers: string[], newNameGeneration: boolean) =>
  headers.map(header => PropertyName.fromLabel(header, { newNameGeneration }).value);

const DATE_FORMAT_FALLBACK = 'YYYY/MM/DD';
const MULTI_VALUE_SEPARATOR = '|';
const DATE_RANGE_SEPARATOR = ':';

const parseDateValue = (dateValue: string, dateFormat: string) => {
  const allowedFormats = [
    dateFormat.toUpperCase(),
    'LL',
    'YYYY MM DD',
    'YYYY/MM/DD',
    'YYYY-MM-DD',
    'YYYY',
  ];
  return moment.utc(dateValue, allowedFormats).unix();
};

const parseLinkValue = (rawValue: string) => {
  let [label, linkUrl] = rawValue.split(MULTI_VALUE_SEPARATOR);
  if (!linkUrl) {
    linkUrl = rawValue;
    label = linkUrl;
  }
  if (!url.parse(linkUrl).host) {
    return null;
  }
  return { label, url: linkUrl };
};

const parseGeolocationValue = (rawValue: string) => {
  const [latRaw, lonRaw] = rawValue.split(MULTI_VALUE_SEPARATOR);
  if (!latRaw || !lonRaw) {
    return null;
  }
  const lat = Number(latRaw);
  const lon = Number(lonRaw);
  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return null;
  }
  return { lat, lon, label: '' };
};

const splitMultiValues = (rawValue: string) =>
  rawValue
    .split(MULTI_VALUE_SEPARATOR)
    .map(value => value.trim())
    .filter(Boolean);

const getValueForLanguage = (params: {
  propName: string;
  language: LanguageISO6391;
  defaultLanguage?: LanguageISO6391;
  languagesPerHeader: Record<string, Set<string>>;
  sanitizedHeaders: string[];
  rowValues: string[];
}) => {
  const { propName, language, defaultLanguage, languagesPerHeader, sanitizedHeaders, rowValues } =
    params;
  const indexFor = (header: string) => sanitizedHeaders.findIndex(h => h === header);
  const resolvedLanguage =
    defaultLanguage && languagesPerHeader[propName]?.has(defaultLanguage)
      ? defaultLanguage
      : language;
  if (languagesPerHeader[propName]?.has(resolvedLanguage)) {
    const header = `${propName}__${resolvedLanguage}`;
    const idx = indexFor(header);
    return idx >= 0 ? rowValues[idx] : '';
  }
  const baseIdx = indexFor(propName);
  return baseIdx >= 0 ? rowValues[baseIdx] : '';
};

const resolveSelectionValue = (thesaurusId: string, raw: string, index: AppliedValueIndex) => {
  const map = index.get(thesaurusId);
  if (!map) return undefined;
  const key =
    normalizeThesaurusLabel(sanitizeThesaurusLabel(raw) || '') || raw.trim().toLowerCase();
  return map.get(key);
};

const isSelectProperty = (property: Property): property is SelectProperty =>
  property.type === 'select' || property.type === 'multiselect';

const buildSelectAssignment = ({
  property,
  value,
  language,
  thesaurusIndex,
}: {
  property: SelectProperty;
  value: string;
  language: LanguageISO6391;
  thesaurusIndex: AppliedValueIndex;
}): MappedAssignment | null => {
  const selection = resolveSelectionValue(property.content, value, thesaurusIndex);
  if (!selection) {
    return null;
  }
  return {
    name: property.name,
    value: [{ value: selection.valueId }],
    language,
  };
};

const buildMultiselectAssignments = ({
  property,
  value,
  language,
  thesaurusIndex,
}: {
  property: SelectProperty;
  value: string;
  language: LanguageISO6391;
  thesaurusIndex: AppliedValueIndex;
}): MappedAssignment[] => {
  const entries = value
    .split(/[|;]/)
    .map(v => v.trim())
    .filter(Boolean)
    .map(part => resolveSelectionValue(property.content, part, thesaurusIndex))
    .filter(Boolean);

  if (!entries.length) {
    return [];
  }

  return [
    {
      name: property.name,
      value: entries.map(entry => ({
        value: entry!.valueId,
      })),
      language,
    },
  ];
};

const buildRelationshipEntries = ({
  property,
  value,
  relationshipIndex,
}: {
  property: V1RelationshipProperty;
  value: string;
  relationshipIndex: RelationshipValueIndex;
}) => {
  const titles = splitMultiValues(value).filter(
    (title, index, list) => list.indexOf(title) === index
  );
  if (!titles.length) {
    return { entries: [], unresolved: [] as string[] };
  }
  const scope = property.content || ANY_TEMPLATE_RELATIONSHIP_KEY;
  const scopeLabel = property.content ? `template ${property.content}` : 'any-template';
  const map = relationshipIndex.get(scope);

  const entries: Array<{ value: string }> = [];
  const unresolved: string[] = [];
  titles.forEach(title => {
    const resolution = map?.get(title);
    const matches = resolution?.matches || [];
    if (!matches.length) {
      unresolved.push(`"${title}" (not_found, scope: ${scopeLabel})`);
      return;
    }
    if (matches.length > 1) {
      unresolved.push(
        `"${title}" (ambiguous, candidates: ${matches.length}, scope: ${scopeLabel})`
      );
      return;
    }
    entries.push({ value: matches[0].sharedId });
  });

  return { entries, unresolved };
};

const buildRelationshipAssignments = ({
  property,
  value,
  language,
  relationshipIndex,
}: {
  property: V1RelationshipProperty;
  value: string;
  language: LanguageISO6391;
  relationshipIndex: RelationshipValueIndex;
}): MappedAssignment[] => {
  const { entries, unresolved } = buildRelationshipEntries({ property, value, relationshipIndex });
  if (unresolved.length) {
    throw new Error(
      `Unresolvable relationship value(s) for property "${property.name}": ${unresolved.join('; ')}`
    );
  }
  if (!entries.length) {
    return [];
  }

  return [
    {
      name: property.name,
      value: entries,
      language,
    },
  ];
};

const buildDefaultAssignment = ({
  property,
  value,
  language,
}: {
  property: Property;
  value: string;
  language: LanguageISO6391;
}): MappedAssignment => ({
  name: property.name,
  value: [{ value }],
  language,
});

const buildDateAssignments = (params: {
  property: Property;
  value: string;
  language: LanguageISO6391;
  dateFormat: string;
}): MappedAssignment[] => {
  const { property, value, language, dateFormat } = params;
  if (!value) {
    return [];
  }
  const entry = { value: parseDateValue(value, dateFormat) };
  return [
    {
      name: property.name,
      value: [entry],
      language,
    },
  ];
};

const buildMultiDateAssignments = (params: {
  property: Property;
  value: string;
  language: LanguageISO6391;
  dateFormat: string;
}): MappedAssignment[] => {
  const { property, value, language, dateFormat } = params;
  const values = splitMultiValues(value);
  if (!values.length) {
    return [];
  }
  const entries = values.map(date => ({ value: parseDateValue(date, dateFormat) }));
  return [
    {
      name: property.name,
      value: entries,
      language,
    },
  ];
};

const buildDateRangeAssignments = (params: {
  property: Property;
  value: string;
  language: LanguageISO6391;
  dateFormat: string;
}): MappedAssignment[] => {
  const { property, value, language, dateFormat } = params;
  if (!value) {
    return [];
  }
  const [fromRaw, toRaw] = value.split(DATE_RANGE_SEPARATOR);
  if (!fromRaw || !toRaw) {
    return [];
  }
  const entry = {
    value: {
      from: parseDateValue(fromRaw, dateFormat),
      to: parseDateValue(toRaw, dateFormat),
    },
  };
  return [
    {
      name: property.name,
      value: [entry],
      language,
    },
  ];
};

const buildMultiDateRangeAssignments = (params: {
  property: Property;
  value: string;
  language: LanguageISO6391;
  dateFormat: string;
}): MappedAssignment[] => {
  const { property, value, language, dateFormat } = params;
  const ranges = splitMultiValues(value);
  if (!ranges.length) {
    return [];
  }
  const entries = ranges
    .map(range => range.split(DATE_RANGE_SEPARATOR))
    .filter(([fromRaw, toRaw]) => fromRaw && toRaw)
    .map(([fromRaw, toRaw]) => ({
      value: {
        from: parseDateValue(fromRaw, dateFormat),
        to: parseDateValue(toRaw, dateFormat),
      },
    }));
  if (!entries.length) {
    return [];
  }
  return [
    {
      name: property.name,
      value: entries,
      language,
    },
  ];
};

const buildLinkAssignments = (params: {
  property: Property;
  value: string;
  language: LanguageISO6391;
}): MappedAssignment[] => {
  const { property, value, language } = params;
  const link = parseLinkValue(value);
  if (!link) {
    return [];
  }
  return [
    {
      name: property.name,
      value: [{ value: link }],
      language,
    },
  ];
};

const buildGeolocationAssignments = (params: {
  property: Property;
  value: string;
  language: LanguageISO6391;
}): MappedAssignment[] => {
  const { property, value, language } = params;
  const geo = parseGeolocationValue(value);
  if (!geo) {
    return [];
  }
  return [
    {
      name: property.name,
      value: [{ value: geo }],
      language,
    },
  ];
};

// eslint-disable-next-line max-statements
const buildAssignmentsForLanguage = ({
  property,
  language,
  defaultLanguage,
  dateFormat,
  headerAnalysis,
  sanitizedHeaders,
  rowValues,
  thesaurusIndex,
  attachmentLookup,
}: {
  property: Property;
  language: LanguageISO6391;
  defaultLanguage: LanguageISO6391;
  dateFormat: string;
  headerAnalysis: ReturnType<typeof CsvHeaderAnalyzer.analyze>;
  sanitizedHeaders: string[];
  rowValues: string[];
  thesaurusIndex: AppliedValueIndex;
  attachmentLookup?: (filename: string) => number | undefined;
}): MappedAssignment[] => {
  const value = getValueForLanguage({
    propName: property.name,
    language,
    defaultLanguage: isSelectProperty(property) ? defaultLanguage : undefined,
    languagesPerHeader: headerAnalysis.languagesPerHeader,
    sanitizedHeaders,
    rowValues,
  });

  if (!value) {
    return [];
  }

  if (property.type === 'image' || property.type === 'media') {
    const attachmentIndex = attachmentLookup?.(value.trim());
    if (attachmentIndex !== undefined) {
      return [
        {
          name: property.name,
          value: [{ attachment: attachmentIndex }],
          language,
        },
      ];
    }
  }

  if (property.type === 'select' && isSelectProperty(property)) {
    const assignment = buildSelectAssignment({ property, value, language, thesaurusIndex });
    return assignment ? [assignment] : [];
  }

  if (property.type === 'multiselect' && isSelectProperty(property)) {
    return buildMultiselectAssignments({ property, value, language, thesaurusIndex });
  }

  if (property.type === 'date') {
    return buildDateAssignments({ property, value, language, dateFormat });
  }

  if (property.type === 'multidate') {
    return buildMultiDateAssignments({ property, value, language, dateFormat });
  }

  if (property.type === 'daterange') {
    return buildDateRangeAssignments({ property, value, language, dateFormat });
  }

  if (property.type === 'multidaterange') {
    return buildMultiDateRangeAssignments({ property, value, language, dateFormat });
  }

  if (property.type === 'link') {
    return buildLinkAssignments({ property, value, language });
  }

  if (property.type === 'geolocation') {
    return buildGeolocationAssignments({ property, value, language });
  }

  return [buildDefaultAssignment({ property, value, language })];
};

const buildAssignmentsForLanguages = (params: {
  property: Property;
  languages: LanguageISO6391[];
  defaultLanguage: LanguageISO6391;
  dateFormat: string;
  headerAnalysis: ReturnType<typeof CsvHeaderAnalyzer.analyze>;
  sanitizedHeaders: string[];
  rowValues: string[];
  thesaurusIndex: AppliedValueIndex;
  attachmentLookup?: (filename: string) => number | undefined;
}) => {
  const { languages } = params;
  const assignments: MappedAssignment[] = [];
  for (const language of languages) {
    assignments.push(
      ...buildAssignmentsForLanguage({
        property: params.property,
        language,
        defaultLanguage: params.defaultLanguage,
        dateFormat: params.dateFormat,
        headerAnalysis: params.headerAnalysis,
        sanitizedHeaders: params.sanitizedHeaders,
        rowValues: params.rowValues,
        thesaurusIndex: params.thesaurusIndex,
        attachmentLookup: params.attachmentLookup,
      })
    );
  }
  return assignments;
};

const resolveRelationshipAssignments = (params: {
  property: Property;
  defaultLanguage: LanguageISO6391;
  headerAnalysis: ReturnType<typeof CsvHeaderAnalyzer.analyze>;
  sanitizedHeaders: string[];
  rowValues: string[];
  relationshipIndex: RelationshipValueIndex;
}) => {
  const {
    property,
    defaultLanguage,
    headerAnalysis,
    sanitizedHeaders,
    rowValues,
    relationshipIndex,
  } = params;
  if (!(property instanceof V1RelationshipProperty)) {
    return [];
  }
  const value = getValueForLanguage({
    propName: property.name,
    language: defaultLanguage,
    defaultLanguage,
    languagesPerHeader: headerAnalysis.languagesPerHeader,
    sanitizedHeaders,
    rowValues,
  });
  if (!value) {
    return [];
  }
  return buildRelationshipAssignments({
    property,
    value,
    language: defaultLanguage,
    relationshipIndex,
  });
};

function buildAssignmentsForProperty(params: {
  property: Property;
  languages: LanguageISO6391[];
  defaultLanguage: LanguageISO6391;
  dateFormat: string;
  headerAnalysis: ReturnType<typeof CsvHeaderAnalyzer.analyze>;
  sanitizedHeaders: string[];
  rowValues: string[];
  thesaurusIndex: AppliedValueIndex;
  relationshipIndex: RelationshipValueIndex;
  attachmentLookup?: (filename: string) => number | undefined;
}): MappedAssignment[] {
  const {
    property,
    defaultLanguage,
    dateFormat,
    headerAnalysis,
    sanitizedHeaders,
    rowValues,
    thesaurusIndex,
    relationshipIndex,
    attachmentLookup,
  } = params;

  if (property.type === 'relationship') {
    return resolveRelationshipAssignments({
      property,
      defaultLanguage,
      headerAnalysis,
      sanitizedHeaders,
      rowValues,
      relationshipIndex,
    });
  }

  return buildAssignmentsForLanguages({
    property,
    languages: params.languages,
    defaultLanguage,
    dateFormat,
    headerAnalysis,
    sanitizedHeaders,
    rowValues,
    thesaurusIndex,
    attachmentLookup,
  });
}

class CsvEntitiesImportMapper {
  constructor(
    private thesauriValuesDS: CsvImportThesauriValuesDataSource,
    private relationshipValuesDS: CsvImportRelationshipValuesDataSource
  ) {}

  private static mapDocAppliedValues(doc: AppliedValueDoc, normalizeFn: (label: string) => string) {
    const byLabel = new Map<string, { valueId: string; label: string; parentLabel?: string }>();
    (doc.appliedValues || []).forEach(value => {
      const normalized = normalizeFn(value.label);
      byLabel.set(normalized, value);
      if (value.parentLabel) {
        const key = `${normalizeFn(value.parentLabel)}::${normalized}`;
        byLabel.set(key, value);
      }
    });
    return byLabel;
  }

  async buildAppliedValuesIndex(importId: string) {
    const docs = await this.thesauriValuesDS.getByImport(importId);
    const index: AppliedValueIndex = new Map();

    const normalize = (label: string) =>
      normalizeThesaurusLabel(sanitizeThesaurusLabel(label) || '') || label.trim().toLowerCase();

    for (const doc of docs) {
      index.set(doc.thesaurusId, CsvEntitiesImportMapper.mapDocAppliedValues(doc, normalize));
    }

    return index;
  }

  async buildRelationshipValuesIndex(importId: string) {
    const docs = await this.relationshipValuesDS.getByImport(importId);
    const index: RelationshipValueIndex = new Map();
    docs.forEach(doc => {
      const values = new Map<
        string,
        { label: string; matches: Array<{ sharedId: string; templateId: string }> }
      >();
      doc.values.forEach(value => {
        values.set(value.label.trim(), {
          label: value.label,
          matches: value.matches,
        });
      });
      index.set(doc.templateId, values);
    });
    return index;
  }

  static sanitizeHeaders(headers: string[], newNameGeneration: boolean) {
    return sanitizeHeaders(headers, newNameGeneration);
  }

  static buildPropertyAssignments(params: {
    template: Template;
    headerAnalysis: ReturnType<typeof CsvHeaderAnalyzer.analyze>;
    sanitizedHeaders: string[];
    rowValues: string[];
    thesaurusIndex: AppliedValueIndex;
    relationshipIndex: RelationshipValueIndex;
    languages: LanguageISO6391[];
    defaultLanguage: LanguageISO6391;
    dateFormat?: string;
    attachmentLookup?: (filename: string) => number | undefined;
  }): MappedAssignment[] {
    const {
      template,
      headerAnalysis,
      sanitizedHeaders,
      rowValues,
      thesaurusIndex,
      relationshipIndex,
      languages,
      defaultLanguage,
      dateFormat,
      attachmentLookup,
    } = params;

    return template.allProperties.flatMap(property =>
      buildAssignmentsForProperty({
        property,
        languages,
        defaultLanguage,
        dateFormat: dateFormat || DATE_FORMAT_FALLBACK,
        headerAnalysis,
        sanitizedHeaders,
        rowValues,
        thesaurusIndex,
        relationshipIndex,
        attachmentLookup,
      })
    );
  }
}

export { CsvEntitiesImportMapper };
export type { MappedAssignment, AppliedValueIndex, RelationshipValueIndex };
