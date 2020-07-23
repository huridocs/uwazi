import { EntitySchema } from 'shared/types/entityType';
import templates from 'api/templates';
import { propertyTypes } from 'shared/propertyTypes';
import { PropertySchema } from 'shared/types/commonTypes.d';
import { ensure } from 'shared/tsUtils';

export async function extractSequence(e: EntitySchema) {
  const template = await templates.getById(ensure<string>(e.template));
  const parts = e.title ? [e.title] : [];
  if (template && template.properties) {
    parts.push(
      ...template.properties.reduce((prev: string[], prop: PropertySchema) => {
        if (
          !prop ||
          !prop.name ||
          !e.metadata ||
          (prop.type !== propertyTypes.markdown && prop.type !== propertyTypes.text)
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
