import { ThesaurusSchema, ThesaurusValueSchema } from 'shared/types/thesaurusType';

import { ClassifierModelSchema } from '../types/classifierModelType';
import { LabelCountSchema } from '../types/labelCountType';

/* Get thesaurus values sorted by name. */
export function getValuesSortedByName(thesaurus: ThesaurusSchema): ThesaurusValueSchema[] {
  const { values = [] } = thesaurus;
  // Ascending
  return values.sort((a, b) => `${a.label}`.localeCompare(b.label));
}

/* Get thesaurus values sorted by classifier model quality for that value. */
export function getValuesSortedByConfidence(
  thesaurus: ThesaurusSchema,
  model: ClassifierModelSchema
): ThesaurusValueSchema[] {
  const { values: thesaurusValues = [] } = thesaurus;
  const { topics: modelValues = {} } = model;
  // Descending
  return thesaurusValues.sort(
    (a, b) => (modelValues[b.id ?? '']?.quality ?? 0) - (modelValues[a.id ?? '']?.quality ?? 0)
  );
}

/* Get thesaurus values sorted by number of documents with outstanding suggestions of that value. */
export function getValuesSortedByToBeReviewed(
  thesaurus: ThesaurusSchema,
  suggestionResult: LabelCountSchema
): ThesaurusValueSchema[] {
  const { values: thesaurusValues = [] } = thesaurus;
  const { values: suggestionValues = {} } = suggestionResult.thesaurus;
  // Descending
  return thesaurusValues.sort(
    (a, b) => (suggestionValues[b.id ?? ''] ?? 0) - (suggestionValues[a.id ?? ''] ?? 0)
  );
}
