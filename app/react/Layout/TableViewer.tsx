import React from 'react';
import moment from 'moment';

import { connect } from 'react-redux';
import { TemplateSchema } from 'shared/types/templateType';
import { PropertySchema } from 'shared/types/commonTypes';
import formatter from '../Metadata/helpers/formater';

export interface DocumentViewerProps {
  rowListZoomLevel: number;
  documents: any;
  storeKey: 'library' | 'uploads';
  clickOnDocument: (...args: any[]) => any;
  onSnippetClick: (...args: any[]) => any;
  deleteConnection: (...args: any[]) => any;
  search: any;
  templates: any;
  thesauris: any;
}

function displayCell(row: any, column: any, index: number) {
  return (
    <td className={!index ? 'sticky-col' : ''}>
      {!index ? (<input type="checkbox" />) : null }
      {row.metadata && row.metadata[column.name] && row.metadata[column.name][0]
        ? JSON.stringify(row.metadata[column.name][0].value)
        : row[column.name]}
    </td>
  );
}

function formatByType(prop: PropertySchema, value: any) {
  switch (prop.type) {
    case 'date': {
      const date = moment.unix(value);
      return date.isValid() ? date.utc().format('MM-DD-YYYY') : '';
    }
    default: {
      return value;
    }
  }
}
function TableView(props: DocumentViewerProps) {
  const data = props.documents.get('rows').toJS();
  const templateIds = props.documents
    .getIn(['aggregations', 'all', '_types', 'buckets'])
    .filter((template: any) => template.getIn(['filtered', 'doc_count']) > 0)
    .map((template: any) => template.get('key'))
    .toJS();

  const templates = props.templates
    .filter((t: TemplateSchema) => templateIds.includes(t.get('_id')))
    .toJS();

  const documents = data.map((doc: any) =>
    formatter.prepareMetadata(doc, props.templates, props.thesauris)
  );

  let columns = templates[0].commonProperties;

  columns = templates.reduce((properties: PropertySchema[], template: TemplateSchema) => {
    const propsToAdd: PropertySchema[] = [];
    (template.properties || []).forEach(templateProperty => {
      if (!properties.find(columnProperty => templateProperty.name === columnProperty.name)) {
        propsToAdd.push(templateProperty);
      }
    });
    return properties.concat(propsToAdd);
  }, columns);

  return (
    <div className="tableview-wrapper">
      <table>
        <thead>
          <tr>
            {columns.map((column: any, index: number) => (
              <th className={!index ? 'sticky-col' : ''}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row: any) => (
            <tr>{columns.map((column: any, index: number) => displayCell(row, column, index))}</tr>
                  ? JSON.stringify(document.metadata[column.name][0].value)
                  : document[column.name]}
          ))}
        </tbody>
      </table>
    </div>
  );
}

const mapStateToProps = (state: any) => ({
  templates: state.templates,
  thesauris: state.thesauris,
});

export const TableViewer = connect(mapStateToProps)(TableView);
