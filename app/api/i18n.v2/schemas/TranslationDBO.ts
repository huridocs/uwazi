export interface TranslationDBO {
  language: string; // should be an enum ?
  key: string;
  value: string;
  context: { type: string; label: string; id: string };
}
