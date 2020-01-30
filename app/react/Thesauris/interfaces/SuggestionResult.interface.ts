/** @format */

export interface ISuggestionResult {
  totalRows: number;
  totalSuggestions: number;
  // suggestion queries are issued per thesaurus
  thesaurus: {
    propertyName: string;
    values: {
      [key: string]: number;
    };
  };
}
