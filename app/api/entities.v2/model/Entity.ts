type BaseMetadataValue = {
  value: unknown;
  label: string;
};

type InheritedResultValue = BaseMetadataValue & {
  inheritedValue: BaseMetadataValue[];
  inheritedType: string;
};

type MetadataValue = BaseMetadataValue | InheritedResultValue;

type Metadata = Record<string, MetadataValue[]>;

export class Entity {
  readonly _id: string;

  readonly sharedId: string;

  readonly language: string;

  readonly template: string;

  readonly title: string;

  readonly metadata: Metadata;

  readonly obsoleteMetadata: string[];

  constructor(
    _id: string,
    sharedId: string,
    language: string,
    title: string,
    template: string,
    metadata: Metadata,
    obsoleteMetadata?: string[]
  ) {
    this._id = _id;
    this.sharedId = sharedId;
    this.language = language;
    this.title = title;
    this.template = template;
    this.metadata = metadata;
    this.obsoleteMetadata = obsoleteMetadata ?? [];
  }
}
export type { Metadata, MetadataValue };
