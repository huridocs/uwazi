import React from 'react';

import { I18NLink } from 'app/I18N';
import GeolocationViewer from 'app/Metadata/components/GeolocationViewer';
import { LinkSchema, MetadataObjectSchema, PropertySchema } from 'shared/types/commonTypes';
import MarkdownViewer from 'app/Markdown';
import { showByType } from 'app/Metadata/components/Metadata';

interface TableCellProps {
  content?: FormattedMetadataValue;
  zoomLevel: number;
}

type FormattedMetadataValue = Omit<PropertySchema, 'type'> & {
  inheritedName?: string;
  parent?: string;
  value?: string | MetadataObjectSchema | MetadataObjectSchema[];
  type: 'inherit' | PropertySchema['type'];
  inheritedType?: PropertySchema['type'];
};

const formatProperty = (prop: FormattedMetadataValue | undefined) => {
  if (!prop?.value) {
    return undefined;
  }

  if (
    prop.type === 'inherit' &&
    (prop.inheritedType === 'image' || prop.inheritedType === 'media')
  ) {
    return (prop.value as MetadataObjectSchema[]).map((p: MetadataObjectSchema) => <>{p.value}</>);
  }
  return showByType(prop, true);
};

export const TableCellComponent = (props: TableCellProps) => {
  const cellValue = formatProperty(props.content);
  return (
    <div className={`table-view-cell table-view-row-zoom-${props.zoomLevel}`}>{cellValue}</div>
  );
};

export const TableCell = React.memo(TableCellComponent);

export type { TableCellProps, FormattedMetadataValue };
