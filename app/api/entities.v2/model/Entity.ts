import { CommonProperty } from 'api/core/domain/template/CommonProperty';
import { Property } from 'api/core/domain/template/Property';
import { EntityInputModel } from '../types/EntityInputDataType';

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

type Icon = {
  label: string;
  type: string;
};

export class Entity {
  readonly _id: string;

  readonly sharedId: string;

  readonly language: string;

  readonly template: string;

  title: string;

  icon?: Icon;

  metadata: Metadata;

  readonly obsoleteMetadata: string[];

  constructor(
    _id: string,
    sharedId: string,
    language: string,
    title: string,
    template: string,
    metadata: Metadata,
    icon?: Icon,
    obsoleteMetadata?: string[]
  ) {
    this._id = _id;
    this.sharedId = sharedId;
    this.language = language;
    this.title = title;
    this.template = template;
    this.metadata = metadata;
    this.icon = icon;
    this.obsoleteMetadata = obsoleteMetadata ?? [];
  }

  static fromInputModel(inputModel: EntityInputModel) {
    return new Entity(
      inputModel._id,
      inputModel.sharedId,
      inputModel.language,
      inputModel.title,
      inputModel.template,
      inputModel.metadata as Metadata
    );
  }

  setPropertyValue(property: Property, value: string) {
    if (property.type === 'text' || property.type === 'markdown') {
      const isTitleProperty = property instanceof CommonProperty && property.name === 'title';
      if (!(property instanceof CommonProperty)) {
        this.metadata[property.name] = this.metadata[property.name] || [{ value: '' }];
        this.metadata[property.name][0].value = value;
      }
      if (isTitleProperty) {
        this.title = value || this.title;
      }
      return this;
    }

    throw new Error('types other than string/markdown are not implemented yet');
  }

  getPropertyValue(property: Property): string {
    if (property.type === 'text' || property.type === 'markdown') {
      const isTitleProperty = property instanceof CommonProperty && property.name === 'title';
      if (isTitleProperty) return this.title;
      return (this.metadata[property.name]?.[0]?.value as string) || '';
    }

    throw new Error('types other than string/markdown are not implemented yet');
  }
}

export type { Metadata, EntityMetadata, MetadataValue, BaseMetadataValue };
