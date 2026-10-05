import type { Property, Template } from '#app/apiResponseTypes.js';
import commonProperties from '#shared/commonProperties.js';

type SelectionEditFields = {
  templateId: string;
  properties: Property[];
  templateOnly: boolean;
};

const withoutTitle = (properties: Property[]) =>
  properties.filter(property => property.name !== 'title');

const withProperties = (templates: Template[]) =>
  templates.map(template => ({ ...template, properties: template.properties ?? [] }));

const selectionEditFields = (
  templates: Template[],
  templateIds: string[],
  chosenTemplateId?: string
): SelectionEditFields => {
  const catalog = withProperties(templates);

  if (chosenTemplateId) {
    const chosen = catalog.find(template => template._id === chosenTemplateId);
    return {
      templateId: chosenTemplateId,
      properties: withoutTitle(chosen?.properties ?? []),
      templateOnly: false,
    };
  }

  const unique = [...new Set(templateIds.filter(Boolean))];
  const properties = withoutTitle(commonProperties.comonProperties(catalog, unique) as Property[]);
  const templateId = unique.length === 1 ? unique[0] : '';

  return {
    templateId,
    properties,
    templateOnly: templateId === '' && properties.length === 0,
  };
};

export type { SelectionEditFields };
export { selectionEditFields };
