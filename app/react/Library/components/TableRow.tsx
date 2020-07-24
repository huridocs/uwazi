import React from 'react';
import { PropertySchema } from 'shared/types/commonTypes';
import { connect } from 'react-redux';

interface TableRowProps {
  columns: PropertySchema[];
  document: any;
  storeKey: 'library' | 'uploads';
  selected?: boolean;
  onClick: any;
}

function displayCell(document: any, column: any, index: number, selected: boolean, onClick: any) {
  const cellValue = document.metadata[column.name]
    ? document.metadata[column.name].value
    : document[column.name];
  return (
    <td className={!index ? 'sticky-col' : ''} key={index}>
      {!index && <input type="checkbox" checked={selected} onClick={onClick} />}
      {cellValue instanceof Object ? JSON.stringify(cellValue) : cellValue}
    </td>
  );
}

class TableRowComponent extends React.Component<TableRowProps> {
  onClick(e: any) {
    if (this.props.onClick) {
      this.props.onClick(e, this.props.document, this.props.selected);
    }
  }

  render() {
    const {document, selected} = this.props;
    return (
      <tr>
        {this.props.columns.map((column: any, index: number) =>
          displayCell(document, column, index, selected || false, this.onClick.bind(this))
        )}
      </tr>
    );
  }
}

function mapStateToProps(state: any, ownProps: TableRowProps) {
  const selected = ownProps.storeKey
    ? !!state[ownProps.storeKey].ui
        .get('selectedDocuments')
        .find((doc:any) => doc.get('_id') === ownProps.document.get('_id'))
    : false;
  return {
    selected,
    document: ownProps.document,
    columns: ownProps.columns,
  };
}

export const TableRow = connect(mapStateToProps)(TableRowComponent);
