import { TemplateSchema } from 'shared/types/templateType';
import { ObjectIdSchema, PropertySchema } from 'shared/types/commonTypes';
import { ensure } from '../../../shared/tsUtils';

interface TranslatableColumn extends PropertySchema {
  translationContext?: string;
}

function columnsFromTemplates(templates: TemplateSchema[]): TranslatableColumn[] {
  return templates.reduce((properties: TranslatableColumn[], template) => {
    const propsToAdd: TranslatableColumn[] = [];
    (template.properties || []).forEach(property => {
      if (
        !['image', 'preview', 'media', 'nested'].includes(property.type) &&
        !properties.find(columnProperty => property.name === columnProperty.name)
      ) {
        propsToAdd.push({ ...property, translationContext: ensure<string>(template._id) });
      }
    });
    return properties.concat(propsToAdd);
  }, []);
}

const getTemplatesToProcess = (
  documents: any,
  templates: TemplateSchema[],
  useTemplates: string[]
) => {
  const queriedTemplates = documents.aggregations.all._types.buckets;
  if (useTemplates.length || queriedTemplates) {
    const templateIds = useTemplates.length
      ? useTemplates
      : queriedTemplates
          .filter((template: any) => template.filtered.doc_count > 0)
          .map((template: any) => template.key);

    return templates.filter((t: TemplateSchema) =>
      templateIds.find((id: ObjectIdSchema) => t._id === id)
    );
  }
  return [];
};

export function getTableColumns(
  documents: any,
  templates: TemplateSchema[],
  useTemplates: string[] = []
): TranslatableColumn[] {
  let columns: TranslatableColumn[] = [];
  const templatesToProcess: TemplateSchema[] = getTemplatesToProcess(
    documents,
    templates,
    useTemplates
  );
  if (templatesToProcess.length > 0) {
    const commonColumns: PropertySchema[] = [
      ...(templatesToProcess[0].commonProperties || []),
      {
        label: 'Template',
        name: 'templateName',
        type: 'text',
        isCommonProperty: true,
      },
    ];

    columns = commonColumns
      .map<TranslatableColumn>(c => ({ ...c, showInCard: true }))
      .concat(columnsFromTemplates(templatesToProcess));
  }
  return columns;
}
