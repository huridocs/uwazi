import React, { Component } from 'react';
import { connect } from 'react-redux';

import { PropertySchema } from 'shared/types/commonTypes';
import { TemplateSchema } from 'shared/types/templateType';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import formatter from 'app/Metadata/helpers/formater';
import { TableCell } from 'app/Library/components/TableCell';
import { EntitySchema } from 'shared/types/entityType';

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

class TableRowComponent extends Component<TableRowProps> {
  static defaultProps = defaultProps;

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
    formattedEntity.metadata.forEach((prop: PropertySchema) => {
      columnValues.set(prop.name, prop);
    });
    function getColumnValue(column: any) {
      let columnValue = columnValues.get(column.get('name'));
      if (!columnValue && column.get('isCommonProperty')) {
        const commonPropValue =
          column.get('name') === 'templateName'
            ? (columnValue = formattedEntity.documentType)
            : (columnValue = formattedEntity[column.get('name')]);
        columnValue = Object.assign({}, column.toJS(), { value: commonPropValue });
      }
      return columnValue;
    }

    return (
      <tr className={selected ? 'selected' : ''}>
        {columns.map((column: any, index: number) => {
          const columnValue = getColumnValue(column);
          return (
            <React.Fragment key={formattedEntity._id + column.get('_id')}>
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
    entity: ownProps.entity,
    columns: ownProps.columns,
    templates: state.templates,
    thesauris: state.thesauris,
  };
}

export const TableRow = connect(mapStateToProps)(TableRowComponent);
