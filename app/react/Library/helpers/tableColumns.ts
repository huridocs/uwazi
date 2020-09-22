import { TemplateSchema } from 'shared/types/templateType';
import { ObjectIdSchema, PropertySchema } from 'shared/types/commonTypes';

function columnsFromTemplates(templates: TemplateSchema[]): PropertySchema[] {
  return templates.reduce((properties: PropertySchema[], template) => {
    const propsToAdd: PropertySchema[] = [];
    (template.properties || []).forEach(property => {
      if (
        !['image', 'preview', 'media', 'nested', 'markdown'].includes(property.type) &&
        !properties.find(columnProperty => property.name === columnProperty.name)
      ) {
        propsToAdd.push(property);
      }
    });
    return properties.concat(propsToAdd);
  }, []);
}

export function getTableColumns(documents: any, templates: TemplateSchema[]): PropertySchema[] {
  let columns: PropertySchema[] = [];
  const queriedTemplates = documents.aggregations.all._types.buckets;
  if (queriedTemplates) {
    const templateIds = queriedTemplates
      .filter((template: any) => template.filtered.doc_count > 0)
      .map((template: any) => template.key);

    const templatesToProcess: TemplateSchema[] = templates.filter((t: TemplateSchema) =>
      templateIds.find((id: ObjectIdSchema) => t._id === id)
    );

    if (templatesToProcess.length > 0) {
      const commonColumns: PropertySchema[] = templatesToProcess[0].commonProperties || [];
      commonColumns.push({
        label: 'Template',
        name: 'templateName',
        type: 'text',
        isCommonProperty: true,
      });

      columns = commonColumns
        .map<PropertySchema>(c => ({ ...c, showInCard: true }))
        .concat(columnsFromTemplates(templatesToProcess));
    }
  }
  return columns;
}
