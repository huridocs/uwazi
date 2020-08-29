import React, { Component } from 'react';
import { connect } from 'react-redux';

import MarkdownViewer from 'app/Markdown';
import { I18NLink } from 'app/I18N';
import GeolocationViewer from 'app/Metadata/components/GeolocationViewer';
import { MetadataObjectSchema, PropertySchema } from 'shared/types/commonTypes';
import { IStore } from 'app/istore';

export interface TableCellProps {
  storeKey: 'library' | 'uploads';
  content: FormattedMetadataValue;
  zoomLevel: number;
}

export interface FormattedMetadataValue extends PropertySchema {
  value?: string | MetadataObjectSchema | MetadataObjectSchema[];
}

function formatProperty(prop: FormattedMetadataValue) {
  let result;
  if (!prop?.value) {
    return undefined;
  }
  if (['date', 'daterange', 'numeric', 'select', 'text', undefined].includes(prop.type)) {
    return prop.value;
  }

  switch (prop.type) {
    case 'multiselect':
    case 'multidaterange':
    case 'multidate':
      result = (prop.value as MetadataObjectSchema[])
        .map((p: MetadataObjectSchema) => p.value)
        .join(', ');
      break;
    case 'link':
      result = (
        <a
          href={(prop.value as MetadataObjectSchema).url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {(prop.value as MetadataObjectSchema).label}
        </a>
      );
      break;
    case 'relationship':
      result = (prop.value as MetadataObjectSchema[]).map(
        (p: MetadataObjectSchema, index: number) => (
          <React.Fragment key={p.value as string}>
            {index > 0 && ', '}
            <I18NLink to={p.url}>{p.value}</I18NLink>
          </React.Fragment>
        )
      );
      break;
    case 'geolocation':
      result = <GeolocationViewer points={prop.value as MetadataObjectSchema[]} onlyForCards />;
      break;
    default:
      result = undefined;
      break;
  }
  return result;
}

class TableCellComponent extends Component<TableCellProps> {
  static defaultProps = { zoomLevel: 0 };

  render() {
    const cellValue = formatProperty(this.props.content);

    return (
      <div className={`table-view-cell table-view-row-zoom-${this.props.zoomLevel}`}>
        {cellValue}
      </div>
    );
  }
}

function mapStateToProps(state: IStore, ownProps: TableCellProps) {
  return {
    zoomLevel: state[ownProps.storeKey].ui.get('zoomLevel'),
  };
}

export const TableCell = connect(mapStateToProps)(TableCellComponent);
