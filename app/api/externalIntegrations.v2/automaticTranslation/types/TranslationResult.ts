export interface TranslationResult {
  key: string[];
  text: string;
  language_from: string;
  languages_to: string[];
  translations: {
    text: string;
    language: string;
    success: boolean;
    error_message: string;
  }[];
}
