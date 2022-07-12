export interface SuggestionsStats {
  data: {
    labeledMatching: number;
    labeled: number;
    nonLabeledMatching: number;
    nonLabeledOthers: number;
    emptyOrObsolete: number;
  };
}
