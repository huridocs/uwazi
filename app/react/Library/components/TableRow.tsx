import React, { Component } from 'react';
import Immutable from 'immutable';

import { connect } from 'react-redux';
import { TemplateSchema } from 'shared/types/templateType';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import { IStore, TableViewColumn } from 'app/istore';
import formatter from 'app/Metadata/helpers/formater';
import { FormattedMetadataValue, TableCell } from 'app/Library/components/TableCell';
import { EntitySchema } from 'shared/types/entityType';
import { IImmutable } from 'shared/types/Immutable';

interface TableRowProps {
  columns: TableViewColumn[];
  entity: IImmutable<EntitySchema>;
  storeKey: 'library' | 'uploads';
  selected?: boolean;
  clickOnDocument: (...args: any[]) => void;
  templates: IImmutable<TemplateSchema[]>;
  thesauris: IImmutable<ThesaurusSchema[]>;
  zoomLevel: number;
}

const defaultProps = {
  templates: Immutable.fromJS([]) as IImmutable<TemplateSchema[]>,
  thesauris: Immutable.fromJS([]) as IImmutable<ThesaurusSchema[]>,
};

function getColumnValue(
  formattedEntity: EntitySchema,
  columnValues: Map<string, FormattedMetadataValue>,
  column: TableViewColumn
) {
  let columnValue: FormattedMetadataValue;
  const columnName = column.name!;
  if (!column.isCommonProperty || columnName === 'creationDate') {
    columnValue = columnValues.get(columnName) as FormattedMetadataValue;
  } else {
    const commonPropValue =
      columnName === 'templateName' ? formattedEntity.documentType : formattedEntity[columnName];
    columnValue = column as FormattedMetadataValue;
    columnValue.value = commonPropValue;
  }
  return columnValue;
}

class TableRowComponent extends Component<TableRowProps> {
  static defaultProps = defaultProps;

  constructor(props: TableRowProps) {
    super(props);
    this.onRowClick = this.onRowClick.bind(this);
    this.renderCell = this.renderCell.bind(this);
  }

  onRowClick(e: { preventDefault: () => void }) {
    if (this.props.clickOnDocument) {
      this.props.clickOnDocument(e, this.props.entity, this.props.selected);
    }
  }

  renderCell(
    index: number,
    storeKey: 'library' | 'uploads',
    selected: boolean | undefined,
    columnValue: FormattedMetadataValue
  ) {
    if (!index) {
      return (
        <div>
          {!index && <input type="checkbox" checked={selected} onClick={this.onRowClick} />}
          <TableCell storeKey={storeKey} content={columnValue} />
        </div>
      );
    }

    return <TableCell storeKey={storeKey} content={columnValue} />;
  }

  render() {
    const { entity, templates, thesauris, columns, selected, storeKey } = this.props;
    const formattedEntity = formatter.prepareMetadata(entity.toJS(), templates, thesauris, null, {
      sortedProperty: 'creationDate',
    });
    const columnValues = new Map();
    formattedEntity.metadata.forEach((prop: FormattedMetadataValue) => {
      columnValues.set(prop.name, prop);
    });

    return (
      <tr className={selected ? 'selected' : ''}>
        {columns.map((column: TableViewColumn, index: number) => {
          const columnValue = getColumnValue(formattedEntity, columnValues, column);
          const columnKey = formattedEntity._id + column.name;
          return (
            <td className={!index ? 'sticky-col' : ''} key={`column_${columnKey}`}>
              {this.renderCell(index, storeKey, selected, columnValue)}
            </td>
          );
        })}
      </tr>
    );
  }
}

function mapStateToProps(state: IStore, ownProps: TableRowProps) {
  const selected: boolean =
    state[ownProps.storeKey].ui
      .get('selectedDocuments')
      .find(
        (doc: IImmutable<EntitySchema> | undefined) =>
          doc?.get('_id') === ownProps.entity.get('_id')
      ) !== undefined;
  return {
    selected,
    templates: state.templates,
    thesauris: state.thesauris,
  };
}

export const TableRow = connect(mapStateToProps)(TableRowComponent);
