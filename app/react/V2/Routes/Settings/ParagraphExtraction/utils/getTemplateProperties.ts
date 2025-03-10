import { Template } from 'app/apiResponseTypes';
import { TemplateSchema } from 'shared/types/templateType';

type TemplateSchemaKeys = keyof TemplateSchema;

const getTemplateProperties = (
  templates: Template[],
  targetId: string,
  properties: TemplateSchemaKeys[]
): Record<TemplateSchemaKeys, unknown> => {
  const foundTemplate = templates.find(template => template._id === targetId);
  return properties.reduce(
    (acc, property) => ({
      ...acc,
      [property]: foundTemplate?.[property],
    }),
    {} as Record<TemplateSchemaKeys, unknown>
  );
};

export { getTemplateProperties };
