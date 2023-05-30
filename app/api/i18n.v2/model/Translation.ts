type ContextType = 'Entity' | 'Relationship Type' | 'Uwazi UI' | 'Thesaurus';

export class Translation {
  readonly key: string;

  readonly value: string;

  readonly language: string;

  readonly context: {
    type: ContextType;
    label: string;
    id: string;
  };

  constructor(
    key: string,
    value: string,
    language: string,
    context: {
      type: ContextType;
      label: string;
      id: string;
    }
  ) {
    this.key = key;
    this.value = value;
    this.language = language;
    this.context = context;
  }
}
