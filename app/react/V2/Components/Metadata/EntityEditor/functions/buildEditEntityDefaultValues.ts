import type { EntityTranslationsDTO } from '#shared/types/entityWithTranslations.js';
import type { Entity } from '#V2/api/entities/types.js';
import type { MetadataValue } from '#V2/formatters/types.js';
import { EMPTY_ICON, hasEntityIcon, type EntityIcon } from '../Components/IconField.js';
import { formatMetadataForForm, type FormMetadataProperty } from './formatMetadataForForm.js';
import { metadataFormKey } from './metadataFormKey.js';

type EditEntityFormValues = {
  title: Entity['title'];
  template: Entity['template'];
  showIcon: boolean;
  icon: EntityIcon;
  metadata: Record<string, MetadataValue[]>;
  translations: EntityTranslationsDTO;
  touchedTranslations: Record<string, Record<string, boolean>>;
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

const encodeFormTranslations = (
  translations: EntityTranslationsDTO | undefined,
  properties: FormMetadataProperty[]
): EntityTranslationsDTO =>
  Object.fromEntries(
    Object.entries(translations ?? {}).map(([language, bucket]) => {
      const next = { ...bucket };
      properties.forEach(property => {
        const key = metadataFormKey(property.name);
        if (key === property.name || !Object.hasOwn(next, property.name)) return;
        next[key] = next[property.name];
        delete next[property.name];
      });
      return [language, next];
    })
  );

const buildEditEntityDefaultValues = (
  entity: Entity | undefined,
  templates: EditEntityTemplate[]
): EditEntityFormValues => {
  const templateId = entity?.template || templates[0]?._id || '';
  const properties =
    templates.find(template => template._id === templateId)?.properties?.map(mapTemplateProperty) ??
    [];
  return {
    title: entity?.title || '',
    template: templateId,
    showIcon: hasEntityIcon(entity?.icon),
    icon: entity?.icon ?? EMPTY_ICON,
    metadata: formatMetadataForForm(properties, entity?.metadata),
    translations: encodeFormTranslations(entity?.translations, properties),
    touchedTranslations: {},
  };
};

export { buildEditEntityDefaultValues, mapTemplateProperty };
export type { EditEntityFormValues, EditEntityTemplate };
