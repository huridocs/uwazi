export interface TranslationDBO {
  language: string; // should be an enum ?
  key: string;
  value: string;
  context: {
    type: 'Entity' | 'Relationship Type' | 'Uwazi UI' | 'Thesaurus';
    label: string;
    id: string;
  };
}
