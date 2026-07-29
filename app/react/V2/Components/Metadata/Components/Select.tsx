import React from 'react';
import { SelectMetadataProperty, MultiSelectMetadataProperty } from '#V2/formatters/types.js';
import { formatMetadataSelectValue } from '#V2/Components/Metadata/display/index.js';

type SelectProps = {
  values: SelectMetadataProperty | MultiSelectMetadataProperty;
};

const Select = ({ values }: SelectProps) => {
  if (!values?.values?.length) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1 font-medium leading-snug">
      {values.values.map(value => {
        const formatted = formatMetadataSelectValue(value);
        return <span key={formatted}>{formatted}</span>;
      })}
    </div>
  );
};

export { Select };
