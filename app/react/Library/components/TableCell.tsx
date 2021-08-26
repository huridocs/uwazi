import React from 'react';

import { I18NLink } from 'app/I18N';
import GeolocationViewer from 'app/Metadata/components/GeolocationViewer';
import { LinkSchema, MetadataObjectSchema, PropertySchema } from 'shared/types/commonTypes';
import MarkdownViewer from 'app/Markdown';

export interface TableCellProps {
  content: FormattedMetadataValue;
  zoomLevel: number;
}

export interface FormattedMetadataValue extends PropertySchema {
  value?: string | MetadataObjectSchema | MetadataObjectSchema[];
}

const formatProperty = (prop: FormattedMetadataValue) => {
  let result;
  if (!prop?.value) {
    return undefined;
  }
  if (
    ['date', 'daterange', 'numeric', 'select', 'text', 'generatedid', undefined].includes(prop.type)
  ) {
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
        <a href={(prop.value as LinkSchema).url || ''} target="_blank" rel="noopener noreferrer">
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
    case 'markdown':
      result = <MarkdownViewer markdown={prop.value} />;
      break;
    default:
      result = undefined;
      break;
  }
  return result;
};

export const TableCellComponent = (props: TableCellProps) => {
  const cellValue = formatProperty(props.content);
  return (
    <div className={`table-view-cell table-view-row-zoom-${props.zoomLevel}`}>{cellValue}</div>
  );
};

export const TableCell = React.memo(TableCellComponent);
