import type { Entity } from '#V2/api/entities/types.js';
import type { MetadataValue } from '#V2/formatters/types.js';
import { EMPTY_ICON, hasEntityIcon, type EntityIcon } from '../Components/IconField.js';
import { formatMetadataForForm, type FormMetadataProperty } from './formatMetadataForForm.js';

type EditEntityFormValues = {
  title: Entity['title'];
  template: Entity['template'];
  showIcon: boolean;
  icon: EntityIcon;
  metadata: Record<string, MetadataValue[]>;
};

type TemplatePropertyInput = {
  _id?: string;
  name: string;
  type: FormMetadataProperty['type'];
  label: string;
  required?: boolean;
  content?: string;
  relationType?: string;
  style?: string;
  inherit?: { property?: string; type?: FormMetadataProperty['inheritedType'] };
};

type EditEntityTemplate = {
  _id: string;
  properties?: TemplatePropertyInput[];
};

const mapTemplateProperty = (property: TemplatePropertyInput): FormMetadataProperty => ({
  _id: String(property._id ?? property.name),
  type: property.type,
  name: property.name,
  label: property.label,
  required: property.required,
  content: property.content,
  relationType: property.relationType,
  style: property.style,
  inherited: Boolean(property.inherit),
  inheritedType: property.inherit?.type,
  inherit: property.inherit,
});

const buildEditEntityDefaultValues = (
  entity: Entity | undefined,
  templates: EditEntityTemplate[]
): EditEntityFormValues => ({
  title: entity?.title || '',
  template: entity?.template || '',
  showIcon: hasEntityIcon(entity?.icon),
  icon: entity?.icon ?? EMPTY_ICON,
  metadata: formatMetadataForForm(
    templates
      .find(template => template._id === entity?.template)
      ?.properties?.map(mapTemplateProperty) || [],
    entity?.metadata
  ),
});

export { buildEditEntityDefaultValues, mapTemplateProperty };
export type { EditEntityFormValues, EditEntityTemplate };
