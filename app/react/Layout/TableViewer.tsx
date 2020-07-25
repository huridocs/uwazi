import React, { Component } from 'react';

import Immutable from 'immutable';
import { connect } from 'react-redux';
import { TemplateSchema } from 'shared/types/templateType';
import { PropertySchema } from 'shared/types/commonTypes';
import { TableRow } from 'app/Library/components/TableRow';

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

function columnsFromTemplates(templates: TemplateSchema[]) {
  return templates.reduce((properties: PropertySchema[], template: TemplateSchema) => {
    const propsToAdd: PropertySchema[] = [];
    template.get('properties', Immutable.Map()).forEach((property: PropertySchema) => {
      if (!properties.find(columnProperty => property.name === columnProperty.name)) {
        propsToAdd.push(property);
      }
    });
    return properties.concat(propsToAdd);
  }, []);
}

class TableViewerComponent extends Component<DocumentViewerProps> {
  constructor(props: DocumentViewerProps) {
    super(props);
    this.documents = this.props.documents.get('rows');
    const templateIds = (this.props.documents || [])
      .getIn(['aggregations', 'all', '_types', 'buckets'])
      .filter((template: any) => template.getIn(['filtered', 'doc_count']) > 0)
      .map((template: any) => template.get('key'));

    const templates = this.props.templates.filter((t: TemplateSchema) =>
      templateIds.find((id: any) => t.get('_id') === id)
    );

    const commonColumns = [
      ...templates.get(0).get('commonProperties'),
      Immutable.fromJS({ label: 'Template', name: 'templateName' }),
    ];
    this.columns = commonColumns.concat(columnsFromTemplates(templates));
  }

  private readonly documents: any[];

  private readonly columns: any[];

  render() {
    return (
      <div className="tableview-wrapper">
        <table>
          <thead>
            <tr>
              {this.columns.map((column: any, index: number) => (
                <th className={!index ? 'sticky-col' : ''} key={index}>
                  {!index && <input type="checkbox" />}
                  {column.get('label')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {this.documents.map((document: any, index: number) => (
              <TableRow
                {...{
                  document,
                  columns: this.columns,
                  key: index,
                  onClick: this.props.clickOnDocument,
                  storeKey: this.props.storeKey,
                  templates: this.props.templates,
                  thesauris: this.props.thesauris,
                }}
              />
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}

const mapStateToProps = (state: any, props: DocumentViewerProps) => ({
  templates: state.templates,
  thesauris: state.thesauris,
  authorized: !!state.user.get('_id'),
  selectedDocuments: state[props.storeKey].ui.get('selectedDocuments'),
});

export const TableViewer = connect(mapStateToProps)(TableViewerComponent);
