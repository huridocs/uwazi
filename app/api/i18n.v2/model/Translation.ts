type ContextType = 'Entity' | 'Relationship Type' | 'Uwazi UI' | 'Thesaurus';

type TranslationContext = {
  type: ContextType;
  label: string;
  id: string;
};

export class Translation {
  readonly key: string;

  readonly value: string;

  readonly language: string;

  readonly context: TranslationContext;

  constructor(key: string, value: string, language: string, context: TranslationContext) {
    this.key = key;
    this.value = value;
    this.language = language;
    this.context = context;
  }
}
