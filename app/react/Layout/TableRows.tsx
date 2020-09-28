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
  documents: IImmutable<{ rows: EntitySchema[] }>;
}

const defaultProps = {
  documents: Immutable.fromJS({ rows: [] }),
};

class TableRowsComponent extends Component<TableRowsProps> {
  static defaultProps = defaultProps;

  render() {
    const { columns, clickOnDocument, storeKey } = this.props;

    return (
      <>
        {this.props.documents.get('rows').map((entity: any) => (
          <TableRow
            {...{
              entity,
              columns,
              clickOnDocument,
              storeKey,
              key: entity.get('_id'),
            }}
          />
        ))}
      </>
    );
  }
}

const mapStateToProps = (state: IStore, props: TableRowsProps) => ({
  documents: state[props.storeKey].documents,
});

export const TableRows = connect(mapStateToProps)(TableRowsComponent);
