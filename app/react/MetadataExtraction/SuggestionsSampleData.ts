/* eslint-disable max-len */

// temporal file with sample data, should be deleted at connecting with backend
import { SuggestionType } from 'shared/types/suggestionType';
import { SuggestionState } from 'shared/types/suggestionSchema';
import _ from 'lodash';

const SuggestionsSamples: SuggestionType[] = [
  {
    title: 'Temporary entity title',
    currentValue: 'Temporary entity title',
    suggestedValue: 'HCT-04-CR-SC-0074-2013: Uganda vs Olowo Kamali',
    segment:
      'Lorem ipsum dolor HCT-04-CR-SC-0074-2013: Uganda vs Olowo Kamali sit amet, consectetur adipiscing elit. Suspendisse sed eleifend neque, non volutpat ex. Aenean posuere blandit fermentum. Cras pellentesque cursus arcu. Etiam non maximus nulla. Integer rhoncus libero a dapibus facilisis.',
    language: 'English',
    state: SuggestionState.filled,
    page: 1,
  },
  {
    title: 'Temporary entity title',
    suggestedValue: 'HCT-04-CR-SC-0080-2008: Uganda vs Okiring J.',
    segment:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque augue nisi, HCT-04-CR-SC-0080-2008: Uganda vs Okiring J.venenatis eget dictum vel. Interdum et malesuada fames ac ante ipsum primis in faucibus. Mauris semper auctor aliquam. Aenean posuere blandit fermentum. Cras pellentesque cursus arcu. Etiam non maximus nulla. Integer rhoncus libero a dapibus facilisis.',
    language: 'English',
    state: SuggestionState.empty,
    page: 1,
  },
  {
    title: 'Succession (Amendment) Decree, 1972',
    currentValue: 'Succession (Amendment) Decree, 1972',
    suggestedValue: 'Succession (Amendment)',
    segment:
      'Lorem ipsum dolor HCT-04-CR-SC-0074-2013: Uganda vs Olowo Kamali sit amet, consectetur adipiscing elit. Quisque augue nisi, Succession (Amendment) Decree, 1972. Integer rhoncus libero a dapibus facilisis.',
    language: 'English',
    state: SuggestionState.filled,
    page: 1,
  },
  {
    title: 'Temporary entity title',
    currentValue: 'Temporary entity title',
    suggestedValue: 'Succession Act - Chapter 162',
    segment:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque augue nisi, venenatis eget dictum vel, scelerisque vitae felis. Succession Act - Chapter 162 Suspendisse sed eleifend neque, non volutpat ex. Interdum et malesuada fames ac ante ipsum primis in faucibus. Mauris semper auctor aliquam. Aenean posuere blandit fermentum. Cras pellentesque cursus arcu. Etiam non maximus nulla. Integer rhoncus libero a dapibus facilisis.',
    language: 'English',
    state: SuggestionState.filled,
    page: 1,
  },
  {
    title: 'Temporary entity title',
    currentValue: 'Temporary entity title',
    suggestedValue: 'Prevention of Trafficking in Persons Act',
    segment:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Prevention of Trafficking in Persons Act Interdum et malesuada fames ac ante ipsum primis in faucibus. Mauris semper auctor aliquam. Aenean posuere blandit fermentum. Cras pellentesque cursus arcu. Etiam non maximus nulla. Integer rhoncus libero a dapibus facilisis.',
    language: 'English',
    state: SuggestionState.filled,
    page: 1,
  },
  {
    title: 'Temporary entity title',
    currentValue: 'Temporary entity title',
    suggestedValue: 'Prevention of Trafficking in Persons Act',
    segment:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque augue nisi, venenatis eget dictum vel, scelerisque vitae felis. Penal Code (Amendment) Act Suspendisse sed eleifend neque, non volutpat ex. Interdum et malesuada fames ac ante ipsum primis in faucibus. Etiam non maximus nulla. Integer rhoncus libero a dapibus facilisis.',
    language: 'English',
    state: SuggestionState.filled,
    page: 1,
  },
];

export const SuggestionsSampleData = (options: {
  page: number;
  limit: number;
  filters: { id: string; value: string }[];
}) => {
  const state = options.filters.find(filter => filter.id === 'state' && filter.value !== '')?.value;
  let suggestions = SuggestionsSamples.map(sample => ({
    ...sample,
    currentValue: sample.currentValue
      ? `${sample.currentValue} ${options.page.toString()}`
      : sample.currentValue,
    state: state || sample.state,
  }));
  while (suggestions.length < options.limit) {
    suggestions = suggestions.concat(suggestions);
  }
  return _.take(suggestions, options.limit);
};
