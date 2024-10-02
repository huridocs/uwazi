import { Property } from 'api/templates.v2/model/Property';

type MetadataValue = unknown;

type BaseMetadataValue = {
  value: MetadataValue;
  label: string;
};

type InheritedResultValue = BaseMetadataValue & {
  inheritedValue: BaseMetadataValue[];
  inheritedType: string;
};

type EntityMetadata = BaseMetadataValue | InheritedResultValue;

type Metadata = Record<string, EntityMetadata[]>;

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

  changePropertyValue(property: Property, value: string) {
    if (property.commonProperty && property.name === 'title') {
      this.title = value;
    }

    if (!property.commonProperty) {
      this.metadata[property.name] = this.metadata[property.name] || [{ value: '' }];
      this.metadata[property.name][0].value = value;
    }
  }
}

export type { Metadata, EntityMetadata, MetadataValue };
