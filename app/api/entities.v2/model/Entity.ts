type Metadata = Record<string, any[]>;

export class Entity {
  readonly sharedId: string;

  readonly template: string;

  readonly metadata: Metadata;

  constructor(sharedId: string, template: string, metadata: Metadata) {
    this.sharedId = sharedId;
    this.template = template;
    this.metadata = metadata;
  }
}
