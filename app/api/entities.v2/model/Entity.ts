type MetadataValue = any;

type Metadata = Record<string, MetadataValue[]>;

export class Entity {
  readonly _id: string;

  readonly sharedId: string;

  readonly language: string;

  readonly template: string;

  readonly title: string;

  readonly metadata: Metadata;

  constructor(
    _id: string,
    sharedId: string,
    language: string,
    title: string,
    template: string,
    metadata: Metadata
  ) {
    this._id = _id;
    this.sharedId = sharedId;
    this.language = language;
    this.title = title;
    this.template = template;
    this.metadata = metadata;
  }
}
export type { Metadata, MetadataValue };
