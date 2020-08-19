import React, { Component } from 'react';
import { connect } from 'react-redux';

import { PropertySchema } from 'shared/types/commonTypes';
import { TemplateSchema } from 'shared/types/templateType';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import formatter from 'app/Metadata/helpers/formater';
import { FormattedMetadataValue, TableCell } from 'app/Library/components/TableCell';
import { EntitySchema } from 'shared/types/entityType';
import { IImmutable } from 'shared/types/Immutable';

interface TableRowProps {
  columns: PropertySchema[];
  entity: EntitySchema;
  storeKey: 'library' | 'uploads';
  selected?: boolean;
  clickOnDocument: (...args: any[]) => any;
  templates: TemplateSchema[];
  thesauris: ThesaurusSchema[];
  zoomLevel: number;
}

const defaultProps = {
  templates: [],
  thesauris: [],
};

function getColumnValue(
  formattedEntity: EntitySchema,
  columnValues: Map<string, FormattedMetadataValue>,
  column: IImmutable<PropertySchema>
) {
  const columnName: string = column.get('name') as string;
  let columnValue: FormattedMetadataValue;
  if (!column.get('isCommonProperty') || column.get('name') === 'creationDate') {
    columnValue = columnValues.get(columnName) as PropertySchema;
  } else {
    const commonPropValue =
      column.get('name') === 'templateName'
        ? formattedEntity.documentType
        : formattedEntity[columnName];
    columnValue = Object.assign({}, column.toJS(), { value: commonPropValue });
  }
  return columnValue || column;
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
        {columns.map((column: any, index: number) => {
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

function mapStateToProps(state: any, ownProps: TableRowProps) {
  const selected = !!state[ownProps.storeKey].ui
    .get('selectedDocuments')
    .find((doc: any) => doc.get('_id') === ownProps.entity.get('_id'));
  return {
    selected,
    templates: state.templates,
    thesauris: state.thesauris,
  };
}

export const TableRow = connect(mapStateToProps)(TableRowComponent);
