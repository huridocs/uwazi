import React, { Component } from 'react';

import { connect } from 'react-redux';
import { TableRow } from 'app/Library/components/TableRow';
import { IImmutable } from 'shared/types/Immutable';
import { EntitySchema } from 'shared/types/entityType';
import { IStore, TableViewColumn } from 'app/istore';

export interface TableViewerProps {
  rowListZoomLevel: number;
  documents: IImmutable<{ rows: EntitySchema[] }>;
  storeKey: 'library' | 'uploads';
  clickOnDocument: (...args: any[]) => void;
  columns: any;
}

class TableViewerComponent extends Component<TableViewerProps> {
  render() {
    const columns = this.props.columns.filter((c: any) => !c.get('hidden'));
    return (
      <div className="tableview-wrapper">
        <table>
          <thead>
            <tr>
              {columns.map((column: IImmutable<TableViewColumn>, index: number) => (
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

const mapStateToProps = (
  state: IStore & { uploads: IStore['library'] },
  props: TableViewerProps
) => {
  const tableViewColumns: any = state[props.storeKey].ui.get('tableViewColumns');
  return {
    columns: tableViewColumns,
  };
};

export const TableViewer = connect(mapStateToProps)(TableViewerComponent);
