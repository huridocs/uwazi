import React, { Component } from 'react';

import { connect } from 'react-redux';
import { List } from 'immutable';
import { IImmutable } from 'shared/types/Immutable';
import { TableRow } from 'app/Library/components/TableRow';
import { IStore, TableViewColumn } from 'app/istore';
import { CollectionViewerProps } from './CollectionViewerProps';

export interface TableViewerProps extends CollectionViewerProps {
  columns: List<IImmutable<TableViewColumn>>;
}

class TableViewerComponent extends Component<TableViewerProps> {
  handleScroll = (e: { target: any }) => {
    const element = e.target;
    if (element.scrollHeight - element.scrollTop === element.clientHeight) {
      const from: number = this.props.documents.get('rows').size;
      this.props.onEndScroll(30, from);
      console.log('fin' + from);
    } else {
      console.log('no fin');
    }
  };

  render() {
    const columns = this.props.columns.toJS().filter((c: TableViewColumn) => !c.hidden);
    return (
      <div className="tableview-wrapper" onScroll={this.handleScroll}>
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

const mapStateToProps = (state: IStore, props: TableViewerProps) => {
  const tableViewColumns = state[props.storeKey].ui.get('tableViewColumns');
  return {
    columns: tableViewColumns,
  };
};

export const TableViewer = connect(mapStateToProps)(TableViewerComponent);
