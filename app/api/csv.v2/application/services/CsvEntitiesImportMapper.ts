/* eslint-disable max-lines */
import { Template } from 'api/core/domain/template/Template';
import { Property } from 'api/core/domain/template/Property';
import { PropertyName } from 'api/core/domain/template/PropertyName';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { normalizeThesaurusLabel } from 'api/thesauri/thesauri';
import { sanitizeThesaurusLabel } from 'shared/sanitizationUtils';
import { SelectProperty } from 'api/core/domain/template/select/SelectProperty';
import { CsvHeaderAnalyzer } from './CsvHeaderAnalyzer';
import { CsvImportThesauriValuesDataSource } from '../contracts/CsvImportThesauriValuesDataSource';

type AppliedValueIndex = Map<
  string,
  Map<string, { valueId: string; label: string; parentLabel?: string }>
>;

type MappedAssignment = {
  value: ReturnType<Property['createPropertyAssignment']>;
  language: LanguageISO6391;
};

type AppliedValueDoc = {
  thesaurusId: string;
  appliedValues?: Array<{ label: string; parentLabel?: string; valueId: string }>;
};

const sanitizeHeaders = (headers: string[], newNameGeneration: boolean) =>
  headers.map(header => PropertyName.fromLabel(header, { newNameGeneration }).value);

const getValueForLanguage = (params: {
  propName: string;
  language: LanguageISO6391;
  languagesPerHeader: Record<string, Set<string>>;
  sanitizedHeaders: string[];
  rowValues: string[];
}) => {
  const { propName, language, languagesPerHeader, sanitizedHeaders, rowValues } = params;
  const indexFor = (header: string) => sanitizedHeaders.findIndex(h => h === header);
  if (languagesPerHeader[propName]?.has(language)) {
    const header = `${propName}__${language}`;
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
    value: property.createPropertyAssignment(
      {
        value: [
          {
            value: selection.valueId,
            label: selection.label,
          },
        ],
        language,
      },
      true
    ),
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
      value: property.createPropertyAssignment(
        {
          value: entries.map(entry => ({
            value: entry!.valueId,
            label: entry!.label,
          })),
          language,
        },
        true
      ),
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
  value: property.createPropertyAssignment(
    {
      value: [{ value }],
      language,
    },
    true
  ),
  language,
});

const buildAssignmentsForLanguage = ({
  property,
  language,
  headerAnalysis,
  sanitizedHeaders,
  rowValues,
  thesaurusIndex,
}: {
  property: Property;
  language: LanguageISO6391;
  headerAnalysis: ReturnType<typeof CsvHeaderAnalyzer.analyze>;
  sanitizedHeaders: string[];
  rowValues: string[];
  thesaurusIndex: AppliedValueIndex;
}): MappedAssignment[] => {
  const value = getValueForLanguage({
    propName: property.name,
    language,
    languagesPerHeader: headerAnalysis.languagesPerHeader,
    sanitizedHeaders,
    rowValues,
  });

  if (!value) {
    return [];
  }

  if (property.type === 'select' && isSelectProperty(property)) {
    const assignment = buildSelectAssignment({ property, value, language, thesaurusIndex });
    return assignment ? [assignment] : [];
  }

  if (property.type === 'multiselect' && isSelectProperty(property)) {
    return buildMultiselectAssignments({ property, value, language, thesaurusIndex });
  }

  return [buildDefaultAssignment({ property, value, language })];
};

function buildAssignmentsForProperty(params: {
  property: Property;
  languages: LanguageISO6391[];
  headerAnalysis: ReturnType<typeof CsvHeaderAnalyzer.analyze>;
  sanitizedHeaders: string[];
  rowValues: string[];
  thesaurusIndex: AppliedValueIndex;
}): MappedAssignment[] {
  const { property, languages, headerAnalysis, sanitizedHeaders, rowValues, thesaurusIndex } =
    params;

  if (property.type === 'relationship') {
    return [];
  }

  const assignments: MappedAssignment[] = [];

  for (const language of languages) {
    assignments.push(
      ...buildAssignmentsForLanguage({
        property,
        language,
        headerAnalysis,
        sanitizedHeaders,
        rowValues,
        thesaurusIndex,
      })
    );
  }

  return assignments;
}

class CsvEntitiesImportMapper {
  constructor(private thesauriValuesDS: CsvImportThesauriValuesDataSource) {}

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

  static sanitizeHeaders(headers: string[], newNameGeneration: boolean) {
    return sanitizeHeaders(headers, newNameGeneration);
  }

  static buildPropertyAssignments(params: {
    template: Template;
    headerAnalysis: ReturnType<typeof CsvHeaderAnalyzer.analyze>;
    sanitizedHeaders: string[];
    rowValues: string[];
    thesaurusIndex: AppliedValueIndex;
    languages: LanguageISO6391[];
  }): MappedAssignment[] {
    const { template, headerAnalysis, sanitizedHeaders, rowValues, thesaurusIndex, languages } =
      params;

    return template.allProperties.flatMap(property =>
      buildAssignmentsForProperty({
        property,
        languages,
        headerAnalysis,
        sanitizedHeaders,
        rowValues,
        thesaurusIndex,
      })
    );
  }
}

export { CsvEntitiesImportMapper };
export type { MappedAssignment, AppliedValueIndex };
