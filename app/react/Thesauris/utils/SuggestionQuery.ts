/** @format */
import { ISuggestionResult } from 'app/Thesauris/interfaces/SuggestionResult.interface';

/*. Unsanitized Elastic Search Result
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
export function buildSuggestionResult(raw: any, thesaurusPropertyName: string): ISuggestionResult {
  const suggestionFieldName = `_${thesaurusPropertyName}`;
  const result: Partial<ISuggestionResult> = {};
  result.totalRows = raw.totalRows || 0;
  result.totalSuggestions = 0;
  if (
    raw.aggregations !== undefined &&
    raw.aggregations.all !== undefined &&
    raw.aggregations.all.hasOwnProperty(suggestionFieldName)
  ) {
    const { buckets: rawValues } = raw.aggregations.all[suggestionFieldName];
    const values: { [key: string]: number } = {};
    rawValues.forEach((rawResult: any) => {
      values[rawResult.key] = rawResult.filtered.doc_count;
      result.totalSuggestions += rawResult.filtered.doc_count;
    });
    result.thesaurus = {
      propertyName: thesaurusPropertyName,
      values,
    };
  }
  return result as ISuggestionResult;
}

/* Flattens SuggestionResult[] into a single SuggestionResult. */
export function flattenSuggestionResults(
  perTemplate: Array<ISuggestionResult>,
  thesaurusPropertyName: string
): ISuggestionResult {
  const result: ISuggestionResult = {
    totalRows: 0,
    totalSuggestions: 0,
    thesaurus: { propertyName: thesaurusPropertyName, values: {} },
  };
  perTemplate.forEach((templateResult: ISuggestionResult) => {
    result.totalRows += templateResult.totalRows;
    result.totalSuggestions += templateResult.totalSuggestions;
    if (
      templateResult.hasOwnProperty('thesaurus') &&
      templateResult.thesaurus.hasOwnProperty('values')
    ) {
      Object.entries(templateResult.thesaurus.values).forEach(([key, value]) => {
        if (!result.thesaurus.values.hasOwnProperty(key)) {
          result.thesaurus.values[key] = 0;
        }
        result.thesaurus.values[key] += value || 0;
      });
    }
  });
  return result;
}
