import uniqueID from 'shared/uniqueID';
import { PropertySchema } from 'shared/types/commonTypes';
import { TemplateSchema } from 'shared/types/templateType';

const emptyTemplate: TemplateSchema = {
  name: '',
  color: '#C03B22',
  entityViewPage: '',
  properties: [],
  commonProperties: [
    {
      label: 'Title',
      name: 'title',
      type: 'text',
      isCommonProperty: true,
    },
    {
      label: 'Date added',
      name: 'date_added',
      type: 'date',
      isCommonProperty: true,
    },
    {
      label: 'Date modified',
      name: 'date_modified',
      type: 'date',
      isCommonProperty: true,
    },
  ],
};

const processDefaultProperties = (props: PropertySchema[]) =>
  props.map(prop => ({
    ...prop,
    rowId: uniqueID(),
    disableRowDnD: true,
    disableRowSelection: true,
  }));

const processProperties = (props: PropertySchema[]) =>
  props.map(prop => ({
    ...prop,
    rowId: uniqueID(),
  }));

export { processDefaultProperties, processProperties, emptyTemplate };
