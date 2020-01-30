/** @format */
import { IClassifierModel } from 'app/Thesauris/interfaces/ClassifierModel.interface';
import { ISuggestionResult } from 'app/Thesauris/interfaces/SuggestionResult.interface';
import { IThesaurus, IThesaurusTopic } from 'app/Thesauris/interfaces/Thesaurus.interface';

/* Get thesaurus values sorted by name. */
export function getValuesSortedByName(thesaurus: IThesaurus): Array<IThesaurusTopic> {
  const { values } = thesaurus;
  // Ascending
  return values.sort((a, b) => `${a.label}`.localeCompare(b.label));
}

/* Get thesaurus values sorted by classifier model quality for that value. */
export function getValuesSortedByConfidence(
  thesaurus: IThesaurus,
  model: IClassifierModel
): Array<IThesaurusTopic> {
  const { values: thesaurusValues } = thesaurus;
  const { topics: modelValues } = model;
  // Descending
  return thesaurusValues.sort((a, b) => modelValues[b.id].quality - modelValues[a.id].quality);
}

/* Get thesaurus values sorted by number of documents with outstanding suggestions of that value. */
export function getValuesSortedByToBeReviewed(
  thesaurus: IThesaurus,
  suggestionResult: ISuggestionResult
): Array<IThesaurusTopic> {
  const { values: thesaurusValues } = thesaurus;
  const { values: suggestionValues } = suggestionResult.thesaurus;
  // Descending
  return thesaurusValues.sort((a, b) => suggestionValues[b.id] - suggestionValues[a.id]);
}
