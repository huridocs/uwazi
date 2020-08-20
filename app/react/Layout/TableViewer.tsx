import React, { Component } from 'react';

import { connect } from 'react-redux';
import { List } from 'immutable';
import { IImmutable } from 'shared/types/Immutable';
import { EntitySchema } from 'shared/types/entityType';
import { TableRow } from 'app/Library/components/TableRow';
import { IStore, TableViewColumn } from 'app/istore';

export interface DocumentViewerProps {
  rowListZoomLevel: number;
  documents: IImmutable<{ rows: EntitySchema[] }>;
  storeKey: 'library' | 'uploads';
  clickOnDocument: (...args: any[]) => void;
  columns: List<IImmutable<TableViewColumn>>;
}

class TableViewerComponent extends Component<DocumentViewerProps> {
  render() {
    const columns = this.props.columns.toJS().filter((c: TableViewColumn) => !c.hidden);
    return (
      <div className="tableview-wrapper">
        <table>
          <thead>
            <tr>
              {columns.map((column: TableViewColumn, index: number) => (
                <th className={!index ? 'sticky-col' : ''} key={column.name}>
                  <div className="table-view-cell">{column.label}</div>
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

const mapStateToProps = (state: IStore, props: DocumentViewerProps) => {
  const tableViewColumns = state[props.storeKey].ui.get('tableViewColumns');
  return {
    columns: tableViewColumns,
  };
};

export const TableViewer = connect(mapStateToProps)(TableViewerComponent);
