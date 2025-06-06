import uniqueID from 'shared/uniqueID';
import { PropertySchema } from 'shared/types/commonTypes';
import { ClientTemplateSchema } from 'V2/shared/types';
import { PropertyRow } from './components/TemplateEditorTableComponents';

const emptyTemplate: ClientTemplateSchema = {
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

const cleanProperty = (prop: PropertyRow) => {
  const { rowId, disableRowDnD, disableRowSelection, ...rest } = prop;
  return rest;
};

export { processDefaultProperties, processProperties, cleanProperty, emptyTemplate };
