export interface SuggestionsStats {
  counts: {
    labeled: number;
    nonLabeledMatching: number;
    nonLabeledNotMatching: number;
    emptyOrObsolete: number;
    all: number;
  };
  accuracy: number;
}
