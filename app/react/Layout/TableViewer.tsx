import React, { Component } from 'react';

import { connect } from 'react-redux';
import { TableRow } from 'app/Library/components/TableRow';
import { PropertySchema } from 'shared/types/commonTypes';
import { IImmutable } from 'shared/types/Immutable';
import { EntitySchema } from 'shared/types/entityType';

export interface DocumentViewerProps {
  rowListZoomLevel: number;
  documents: IImmutable<{ rows: EntitySchema[] }>;
  storeKey: 'library' | 'uploads';
  clickOnDocument: (...args: any[]) => void;
  columns: IImmutable<PropertySchema>[];
}

class TableViewerComponent extends Component<DocumentViewerProps> {
  render() {
    const columns = this.props.columns.filter(c => !c.get('hidden'));
    return (
      <div className="tableview-wrapper">
        <table>
          <thead>
            <tr>
              {columns.map((column: IImmutable<PropertySchema>, index: number) => (
                <th className={!index ? 'sticky-col' : ''} key={column.get('name')}>
                  <div className="table-view-cell">{column.get('label')}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {this.props.documents.get('rows').map((entity: any) => (
              <TableRow
                {...{
                  entity,
                  columns,
                  key: entity.get('_id'),
                  clickOnDocument: this.props.clickOnDocument,
                  storeKey: this.props.storeKey,
                  zoomLevel: this.props.rowListZoomLevel,
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
  selectedDocuments: state[props.storeKey].ui.get('selectedDocuments'),
  columns: state[props.storeKey].ui.get('tableViewColumns'),
});

export const TableViewer = connect(mapStateToProps)(TableViewerComponent);
