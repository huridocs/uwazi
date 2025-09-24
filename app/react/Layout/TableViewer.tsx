import React, { Component } from 'react';
import { createSelector } from 'reselect';

import { connect } from 'react-redux';
// @ts-expect-error TS(2307): Cannot find module '../../istore.js' or its corres... Remove this comment to see the full error message
import { EntityDisplayState, IStore, TableViewColumn } from '../../istore.js';
// @ts-expect-error TS(2307): Cannot find module '../../I18N/index.js' or its co... Remove this comment to see the full error message
import { Translate } from '../../I18N/index.js';
// @ts-expect-error TS(2307): Cannot find module '../../Layout/TableRows.js' or ... Remove this comment to see the full error message
import { TableRows } from '../../Layout/TableRows.js';
import { CollectionViewerProps } from './CollectionViewerProps';

interface TableViewerProps extends CollectionViewerProps {
  columns: TableViewColumn[];
}

class TableViewerComponent extends Component<TableViewerProps> {
  static wrapLoader = true;

  render() {
    const columns = this.props.columns.filter((c: TableViewColumn) => !c.hidden);
    return (
      <div className="tableview-wrapper">
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
const selectTableViewColumns = createSelector(getTableViewColumnsSelector, columns =>
  columns?.toJS()
);

const mapStateToProps = (state: IStore, props: TableViewerProps) => ({
  columns: selectTableViewColumns(state[props.storeKey]),
});

export { selectTableViewColumns };
export type { TableViewerProps };

export const TableViewer = connect(mapStateToProps)(TableViewerComponent);
