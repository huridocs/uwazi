import { LanguageISO6391 } from '#shared/types/commonTypes.js';

const CONTEXT_TYPES = ['Entity', 'Relationship Type', 'Uwazi UI', 'Thesaurus'] as const;

type ContextType = (typeof CONTEXT_TYPES)[number];

export type TranslationContext = {
  type: ContextType;
  label: string;
  id: string;
};

export const isTranslationContextType = (value: unknown): value is ContextType =>
  typeof value === 'string' && (CONTEXT_TYPES as readonly string[]).includes(value);

export const assertCompleteTranslationContext = (context: TranslationContext) => {
  if (typeof context.id !== 'string' || !context.id) {
    throw new Error(
      `Translation context.id must be a non-empty string, received ${JSON.stringify(context.id)}`
    );
  }
  if (!isTranslationContextType(context.type)) {
    throw new Error(
      `Translation context.type must be one of ${CONTEXT_TYPES.join(', ')}, received ${JSON.stringify(context.type)}`
    );
  }
  if (typeof context.label !== 'string' || !context.label) {
    throw new Error(
      `Translation context.label must be a non-empty string, received ${JSON.stringify(context.label)}`
    );
  }
};

export class Translation {
  readonly key: string;

  readonly value: string;

  readonly language: LanguageISO6391;

  readonly context: TranslationContext;

  constructor(key: string, value: string, language: LanguageISO6391, context: TranslationContext) {
    if (typeof context.id !== 'string') {
      throw new Error(`context.id is of type "${typeof context.id}", should be a string`);
    }
    if (value === null || value === undefined) {
      throw new Error(`Translation value for key "${key}" cannot be null or undefined`);
    }
    this.key = key;
    this.value = value;
    this.language = language;
    this.context = context;
  }

  static forLanguages(
    context: TranslationContext,
    values: Record<string, string>,
    languages: LanguageISO6391[]
  ): Translation[] {
    return languages.flatMap(language =>
      Object.entries(values).map(([key, value]) => new Translation(key, value, language, context))
    );
  }
}
