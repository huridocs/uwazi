import type { Template } from '#app/apiResponseTypes.js';
import type { DatavizSource } from '#V2/Dataviz/types/definition.js';

const FILTERABLE_TYPES = new Set(['select', 'multiselect', 'numeric', 'date', 'text']);

export type FilterablePropertyOption = {
  sourceAlias?: string;
  templateId: string;
  templateName: string;
  propertyName: string;
  propertyLabel: string;
  propertyType: string;
};

export const getFilterableProperties = (
  templates: Template[],
  sources: DatavizSource[]
): FilterablePropertyOption[] => {
  const options: FilterablePropertyOption[] = [];

  sources.forEach(source => {
    const template = templates.find(t => t._id === source.templateId);
    if (!template) return;

    const props = [...(template.commonProperties || []), ...(template.properties || [])].filter(p =>
      FILTERABLE_TYPES.has(p.type)
    );

    props.forEach(prop => {
      options.push({
        sourceAlias: source.alias,
        templateId: source.templateId,
        templateName: template.name,
        propertyName: prop.name,
        propertyLabel: prop.label,
        propertyType: prop.type,
      });
    });
  });

  return options;
};
