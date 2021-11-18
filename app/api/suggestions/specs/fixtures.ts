import { DBFixture } from 'api/utils/testing_db';
import { SuggestionState } from 'shared/types/suggestionSchema';

export const fixtures: DBFixture = {
  ixsuggestions: [
    {
      propertyName: 'title',
      sharedId: 'shared1',
      suggestedValue: 'HCT-04-CR-SC-0074-2013: Uganda vs Olowo Kamali',
      segment:
        'Lorem ipsum dolor HCT-04-CR-SC-0074-2013: Uganda vs Olowo Kamali sit amet, consectetur adipiscing elit. Suspendisse sed eleifend neque, non volutpat ex. Aenean posuere blandit fermentum. Cras pellentesque cursus arcu. Etiam non maximus nulla. Integer rhoncus libero a dapibus facilisis.',
      language: 'English',
      state: SuggestionState.filled,
      page: 1,
    },
  ],
};
