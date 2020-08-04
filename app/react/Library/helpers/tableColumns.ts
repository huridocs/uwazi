import { TemplateSchema } from 'shared/types/templateType';
import { ObjectIdSchema, PropertySchema } from 'shared/types/commonTypes';

function columnsFromTemplates(templates: TemplateSchema[]): PropertySchema[] {
  return templates.reduce((properties: PropertySchema[], template) => {
    const propsToAdd: PropertySchema[] = [];
    (template.properties || []).forEach(property => {
      if (
        !['image', 'preview', 'media'].includes(property.type) &&
        !properties.find(columnProperty => property.name === columnProperty.name)
      ) {
        propsToAdd.push(property);
      }
    });
    return properties.concat(propsToAdd);
  }, []);
}

export function getTableColumns(documents: any, templates: TemplateSchema[]) {
  let columns = [];
  const queriedTemplates = documents.aggregations.all._types.buckets;
  if (queriedTemplates) {
    const templateIds = queriedTemplates
      .filter((template: any) => template.filtered.doc_count > 0)
      .map((template: any) => template.key);

    const templatesToProcess: TemplateSchema[] = templates.filter((t: TemplateSchema) =>
      templateIds.find((id: ObjectIdSchema) => t._id === id)
    );

    if (!templatesToProcess.length) {
      return [];
    }

    const commonColumns: any[] = templatesToProcess[0].commonProperties || [];
    commonColumns.push({
      label: 'Template',
      name: 'templateName',
      type: 'text',
    });

    columns = commonColumns
      .map(c => Object.assign(c, { hidden: false }))
      .concat(columnsFromTemplates(templatesToProcess));
  }
  return columns;
}
