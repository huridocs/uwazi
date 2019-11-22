/** @format */
import { EntitySchema } from 'api/entities/entityType';
import templates from 'api/templates';
import { propertyTypes } from 'shared/propertyTypes';

export async function extractSequence(e: EntitySchema) {
  const template = await templates.getById(e.template);
  const parts = e.title ? [e.title] : [];
  if (template && template.properties) {
    parts.push(
      ...template.properties.reduce((prev: string[], prop) => {
        if (
          !prop ||
          !prop.name ||
          !e.metadata ||
          ![propertyTypes.markdown, propertyTypes.text].includes(prop.type)
        ) {
          return prev;
        }
        const values = e.metadata[prop.name];
        if (
          !values ||
          values.length !== 1 ||
          !values[0].value ||
          typeof values[0].value !== 'string'
        ) {
          return prev;
        }
        return prev.concat([values[0].value]);
      }, [])
    );
  }
  return parts.join(' ');
}

export function buildModelName(thesaurusName: string) {
  return `${process.env.DATABASE_NAME}-${thesaurusName.toLowerCase().replace(/ /g, '_')}`;
}
