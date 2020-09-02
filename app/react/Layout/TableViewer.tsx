import React, { Component } from 'react';
import { createSelector } from 'reselect';

import { connect } from 'react-redux';
import { TableRow } from 'app/Library/components/TableRow';
import { EntityDisplayState, IStore, TableViewColumn } from 'app/istore';
import { Translate } from 'app/I18N';
import { CollectionViewerProps } from './CollectionViewerProps';

export interface TableViewerProps extends CollectionViewerProps {
  columns: TableViewColumn[];
}

class TableViewerComponent extends Component<TableViewerProps> {
  shouldComponentUpdate(nextProps: TableViewerProps) {
    const nextHiddenCount = nextProps.columns.filter((c: TableViewColumn) => !c.hidden).length;
    const currentHiddenCount = this.props.columns.filter((c: TableViewColumn) => !c.hidden).length;
    const nextEntityCount = nextProps.documents.get('rows').count();
    const currentEntityCount = this.props.documents.get('rows').count();
    const noColumns = nextProps.columns.length === 0;
    return (
      !noColumns &&
      (nextHiddenCount !== currentHiddenCount || nextEntityCount !== currentEntityCount)
    );
  }

  handleScroll = (e: { target: any }) => {
    const DEFAULT_PAGE_SIZE = 30;
    const element = e.target;
    if (element.scrollHeight - element.scrollTop === element.clientHeight) {
      const from: number = this.props.documents.get('rows').size;
      this.props.onEndScroll(DEFAULT_PAGE_SIZE, from);
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
                    <Translate>{column.label}</Translate>
                  </div>
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

const getTableViewSelector = (state: EntityDisplayState) => state.ui.get('tableViewColumns');
export const selectTableViewColumns = createSelector(getTableViewSelector, columns =>
  columns?.toJS()
);

const mapStateToProps = (state: IStore, props: TableViewerProps) => ({
  columns: selectTableViewColumns(state[props.storeKey]),
});

export const TableViewer = connect(mapStateToProps)(TableViewerComponent);
