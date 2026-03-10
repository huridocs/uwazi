import React from 'react';
import { MetadataObjectSchema, PropertySchema } from 'shared/types/commonTypes';
import { showByType } from 'app/Metadata/components/Metadata';

interface TableCellProps {
  content?: FormattedMetadataValue;
  zoomLevel: number;
}

type FormattedMetadataValue = Omit<PropertySchema, 'type'> & {
  inheritedName?: string;
  value?:
    | string
    | MetadataObjectSchema
    | MetadataObjectSchema[]
    | [{ parent: string; value: MetadataObjectSchema[] }];
  type: 'inherit' | PropertySchema['type'];
  inheritedType?: PropertySchema['type'];
  onlyForCards?: boolean;
};

const formatProperty = (prop: FormattedMetadataValue | undefined) => {
  if (!prop?.value) {
    return undefined;
  }

  const inheritedMedia =
    prop.type === 'inherit' && (prop.inheritedType === 'image' || prop.inheritedType === 'media');
  const typeMedia = prop.type === 'image' || prop.type === 'media';

  if (inheritedMedia || typeMedia) {
    return undefined;
  }
  return showByType({ prop, compact: true });
};

export const TableCellComponent = (props: TableCellProps) => {
  const cellValue = formatProperty(props.content);
  return (
    <div className={`table-view-cell table-view-row-zoom-${props.zoomLevel}`}>{cellValue}</div>
  );
};

export const TableCell = React.memo(TableCellComponent);

export type { TableCellProps, FormattedMetadataValue };
