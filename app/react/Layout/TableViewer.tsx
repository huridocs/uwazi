import React, { Component } from 'react';

import { connect } from 'react-redux';
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
  columns: any[];
}

class TableViewerComponent extends Component<DocumentViewerProps> {
  render() {
    const columns = this.props.columns.filter(c => !c.get('hidden'));
    return (
      <div className="tableview-wrapper">
        <table>
          <thead>
            <tr>
              {columns.map((column: any, index: number) => (
                <th className={!index ? 'sticky-col' : ''} key={index}>
                  {column.get('label')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {this.props.documents.get('rows').map((document: any, index: number) => (
              <TableRow
                {...{
                  document,
                  columns,
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
  columns: state[props.storeKey].ui.get('tableViewColumns'),
});

export const TableViewer = connect(mapStateToProps)(TableViewerComponent);
