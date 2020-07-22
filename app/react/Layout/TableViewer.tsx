import React from 'react';
import { connect } from 'react-redux';

import { TemplateSchema } from 'shared/types/templateType';
import { PropertySchema } from 'shared/types/commonTypes';

export interface DocumentViewerProps {
  rowListZoomLevel: number;
  documents: any;
  storeKey: 'library' | 'uploads';
  clickOnDocument: (...args: any[]) => any;
  onSnippetClick: (...args: any[]) => any;
  deleteConnection: (...args: any[]) => any;
  search: any;
  templates: any;
}

function TableView(props: DocumentViewerProps) {
  const data = props.documents.get('rows').toJS();
  const templateIds = props.documents
    .getIn(['aggregations', 'all', '_types', 'buckets'])
    .filter((t: any) => t.getIn(['filtered', 'doc_count']) > 0)
    .map((t: any) => t.get('key'))
    .toJS();

  const templates = props.templates
    .filter((t: TemplateSchema) => templateIds.includes(t.get('_id')))
    .toJS();

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
    <table>
      <thead>
        <tr>
          {columns.map((column: any) => (
            <th>{column.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row: any) => (
          <tr>
            {columns.map((column: any) => (
              <td>
                {row.metadata && row.metadata[column.name] && row.metadata[column.name][0]
                  ? JSON.stringify(row.metadata[column.name][0].value)
                  : row[column.name]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const mapStateToProps = (state: any) => ({
  templates: state.templates,
});

export const TableViewer = connect(mapStateToProps)(TableView);
