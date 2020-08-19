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
  columns: IImmutable<TableViewColumn>[];
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
  column: IImmutable<TableViewColumn>
) {
  const columnName: string = column.get('name') as string;
  let columnValue: FormattedMetadataValue;
  if (!column.get('isCommonProperty') || column.get('name') === 'creationDate') {
    columnValue = columnValues.get(columnName) as FormattedMetadataValue;
  } else {
    const commonPropValue =
      columnName === 'templateName' ? formattedEntity.documentType : formattedEntity[columnName];
    columnValue = column.toJS() as FormattedMetadataValue;
    columnValue.value = commonPropValue;
  }
  return columnValue;
}

class TableRowComponent extends Component<TableRowProps> {
  static defaultProps = defaultProps;

  constructor(props: TableRowProps) {
    super(props);
    this.onRowClick = this.onRowClick.bind(this);
  }

  onRowClick(e: { preventDefault: () => void }) {
    if (this.props.clickOnDocument) {
      this.props.clickOnDocument(e, this.props.entity, this.props.selected);
    }
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
        {columns.map((column: IImmutable<TableViewColumn>, index: number) => {
          const columnValue = getColumnValue(formattedEntity, columnValues, column);
          const columnKey = formattedEntity._id + column.get('name');
          return (
            <React.Fragment key={`column_${columnKey}`}>
              <td className={!index ? 'sticky-col' : ''}>
                {!index && <input type="checkbox" checked={selected} onClick={this.onRowClick} />}
                <TableCell storeKey={storeKey} content={columnValue} />
              </td>
            </React.Fragment>
          );
        })}
      </tr>
    );
  }
}

function mapStateToProps(state: IStore & { uploads: IStore['library'] }, ownProps: TableRowProps) {
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
