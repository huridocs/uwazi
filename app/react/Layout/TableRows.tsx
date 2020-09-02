import React, { Component } from 'react';

import { connect } from 'react-redux';
import { TableRow } from 'app/Library/components/TableRow';
import { IStore, TableViewColumn } from 'app/istore';
import { IImmutable } from 'shared/types/Immutable';
import { EntitySchema } from 'shared/types/entityType';
import Immutable from 'immutable';

interface TableRowsProps {
  columns: TableViewColumn[];
  storeKey: 'library' | 'uploads';
  clickOnDocument: (e: React.SyntheticEvent, doc: EntitySchema, active: boolean) => any;
  onEndScroll: (amount: number, from: number) => void;
  documents: IImmutable<{ rows: EntitySchema[] }>;
  rowListZoomLevel: number;
}

const defaultProps = {
  documents: Immutable.fromJS({ rows: [] }),
  rowListZoomLevel: 2,
};

class TableRowsComponent extends Component<TableRowsProps> {
  static defaultProps = defaultProps;

  render() {
    console.log('render rows');

    return (
      <>
        {this.props.documents.get('rows').map((entity: any) => (
          <TableRow
            {...{
              entity,
              columns: this.props.columns,
              key: entity.get('_id'),
              clickOnDocument: this.props.clickOnDocument,
              storeKey: this.props.storeKey,
              zoomLevel: this.props.rowListZoomLevel,
            }}
          />
        ))}
      </>
    );
  }
}

const mapStateToProps = (state: IStore, props: TableRowsProps) => ({
  documents: state[props.storeKey].documents,
  rowListZoomLevel: state[props.storeKey].ui.get('zoomLevel'),
});

export const TableRows = connect(mapStateToProps)(TableRowsComponent);
