import React, { Component } from 'react';
import { connect } from 'react-redux';

import MarkdownViewer from 'app/Markdown';
import { I18NLink } from 'app/I18N';
import GeolocationViewer from 'app/Metadata/components/GeolocationViewer';
import { PropertySchema } from 'shared/types/commonTypes';

export interface TableCellProps {
  storeKey: 'library' | 'uploads';
  content: PropertySchema;
  zoomLevel: number;
}

function formatProperty(prop: any) {
  let result = prop?.value;
  if (!result) {
    return undefined;
  }
  if (['date', 'daterange', 'numeric', 'select', 'text', undefined].includes(prop.type)) {
    return result;
  }

  switch (prop.type) {
    case 'multiselect':
    case 'multidaterange':
    case 'multidate':
      result = prop.value.map((p: any) => p.value).join(', ');
      break;
    case 'markdown':
      result = <MarkdownViewer markdown={prop.value} />;
      break;
    case 'link':
      result = (
        <a href={prop.value.url} target="_blank" rel="noopener noreferrer">
          {prop.value.label}
        </a>
      );
      break;
    case 'relationship':
      result = prop.value.map((p: any, index: number) => (
        <React.Fragment key={p.value}>
          {index > 0 && ', '}
          <I18NLink to={p.url}>{p.value}</I18NLink>
        </React.Fragment>
      ));
      break;
    case 'geolocation':
      result = <GeolocationViewer points={prop.value} onlyForCards />;
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

function mapStateToProps(state: any, ownProps: TableCellProps) {
  return {
    zoomLevel: state[ownProps.storeKey].ui.get('zoomLevel'),
  };
}

export const TableCell = connect(mapStateToProps)(TableCellComponent);
