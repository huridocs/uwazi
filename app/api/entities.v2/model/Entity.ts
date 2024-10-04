import { CommonProperty } from 'api/templates.v2/model/CommonProperty';
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
    if (property.type === 'text') {
      const isTitleProperty = property instanceof CommonProperty && property.name === 'title';
      const { metadata } = this;
      if (!(property instanceof CommonProperty)) {
        metadata[property.name] = this.metadata[property.name] || [{ value: '' }];
        metadata[property.name][0].value = value;
      }
      return new Entity(
        this._id,
        this.sharedId,
        this.language,
        isTitleProperty ? value : this.title,
        this.template,
        metadata
      );
    }

    throw new Error('types other than string are not implemented yet');
  }
}

export type { Metadata, EntityMetadata, MetadataValue };
