import React, { Component } from 'react';
import { createSelector } from 'reselect';

import { connect } from 'react-redux';
import { EntityDisplayState, IStore, TableViewColumn } from 'app/istore';
import { Translate } from 'app/I18N';
import { TableRows } from 'app/Layout/TableRows';
import { CollectionViewerProps } from './CollectionViewerProps';

export interface TableViewerProps extends CollectionViewerProps {
  columns: TableViewColumn[];
}

class TableViewerComponent extends Component<TableViewerProps> {
  handleScroll = (e: { target: any }) => {
    const element = e.target;
    if (element.scrollHeight - element.scrollTop === element.clientHeight) {
      this.props.loadNextGroupOfEntities();
    }
  };

  render() {
    const columns = this.props.columns.filter((c: TableViewColumn) => !c.hidden);
    return (
      <div className="tableview-wrapper" onScroll={this.handleScroll}>
        <table>
          <thead>
            <tr>
              {columns.map((column: TableViewColumn, index: number) => (
                <th className={!index ? 'sticky-col' : ''} key={column.name}>
                  <div className="table-view-cell">
                    <Translate context={column.translationContext}>{column.label}</Translate>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <TableRows
              columns={columns}
              clickOnDocument={this.props.clickOnDocument}
              storeKey={this.props.storeKey}
            />
          </tbody>
        </table>
      </div>
    );
  }
}

const getTableViewColumnsSelector = (state: EntityDisplayState) => state.ui.get('tableViewColumns');
export const selectTableViewColumns = createSelector(getTableViewColumnsSelector, columns =>
  columns?.toJS()
);

const mapStateToProps = (state: IStore, props: TableViewerProps) => ({
  columns: selectTableViewColumns(state[props.storeKey]),
});

export const TableViewer = connect(mapStateToProps)(TableViewerComponent);
