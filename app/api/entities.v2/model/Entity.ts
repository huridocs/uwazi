type Metadata = Record<string, any[]>;

export class Entity {
  readonly sharedId: string;

  readonly language: string;

  readonly template: string;

  readonly metadata: Metadata;

  constructor(sharedId: string, language: string, template: string, metadata: Metadata) {
    this.sharedId = sharedId;
    this.language = language;
    this.template = template;
    this.metadata = metadata;
  }
}
