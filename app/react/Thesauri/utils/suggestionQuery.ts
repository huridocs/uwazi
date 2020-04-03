import { LabelCountSchema } from '../types/labelCountType';

/* An Un-sanitized Elastic Search Result
.
└── template results: []
    ├── result 1: {}
    └── result 2: {}
        ├── rows: []
        ├── totalRows: number
        └── aggregations: []
            └── aggregation: {}
                └── all: {}
                    ├── meta
                    ├── doc_count: number
                    ├── thesaurus: {}
                    │   └── buckets: []
                    └── _thesaurus: {}
                        └── buckets: []
                            └── bucket: {}
                                ├── key: string
                                ├── doc_count: number
                                └── filtered: {}
                                    ├── meta
                                    └── doc_count: number
                                    */

/* Takes an elastic query response and transforms it into a SuggestionResult.*/
export function buildLabelCounts(
  raw: any,
  thesaurusPropertyName: string,
  countSuggestions: boolean = true
): LabelCountSchema {
  const suggestionFieldName = `${countSuggestions ? '__' : ''}${thesaurusPropertyName}`;
  const result: Partial<LabelCountSchema> = {};
  result.totalRows = raw.totalRows || 0;
  result.totalLabels = 0;
  if (
    raw.aggregations !== undefined &&
    raw.aggregations.all !== undefined &&
    raw.aggregations.all.hasOwnProperty(suggestionFieldName)
  ) {
    const { buckets: rawValues } = raw.aggregations.all[suggestionFieldName];
    const totalValues: { [key: string]: number } = {};
    rawValues.forEach((rawResult: any) => {
      totalValues[rawResult.key] = rawResult.filtered.doc_count;
      result.totalLabels += rawResult.filtered.doc_count;
    });
    result.thesaurus = {
      propertyName: thesaurusPropertyName,
      totalValues,
    };
  }
  return result as LabelCountSchema;
}

/* Flattens SuggestionResult[] into a single SuggestionResult. */
export function flattenLabelCounts(
  perTemplate: LabelCountSchema[],
  thesaurusPropertyName: string
): LabelCountSchema {
  const result: LabelCountSchema = {
    totalRows: 0,
    totalLabels: 0,
    thesaurus: { propertyName: thesaurusPropertyName, totalValues: {} },
  };
  perTemplate.forEach((templateResult: LabelCountSchema) => {
    result.totalRows += templateResult.totalRows;
    result.totalLabels += templateResult.totalLabels;
    if (
      templateResult.hasOwnProperty('thesaurus') &&
      templateResult.thesaurus.hasOwnProperty('totalValues')
    ) {
      Object.entries(templateResult.thesaurus.totalValues).forEach(([key, value]) => {
        if (!result.thesaurus.totalValues.hasOwnProperty(key)) {
          result.thesaurus.totalValues[key] = 0;
        }
        result.thesaurus.totalValues[key]! += value || 0;
      });
    }
  });
  return result;
}
