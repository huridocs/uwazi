import { LanguageISO6391 } from 'shared/types/commonTypes';

type ContextType = 'Entity' | 'Relationship Type' | 'Uwazi UI' | 'Thesaurus';

export type TranslationContext = {
  type: ContextType;
  label: string;
  id: string;
};

export class Translation {
  readonly key: string;

  readonly value: string;

  readonly language: LanguageISO6391;

  readonly context: TranslationContext;

  constructor(key: string, value: string, language: LanguageISO6391, context: TranslationContext) {
    this.key = key;
    this.value = value;
    this.language = language;
    this.context = context;
  }
}
