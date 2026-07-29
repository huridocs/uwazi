import React from 'react';
import { SimpleMetadataProperty } from '#V2/formatters/types.js';

type SimpleValueProps = {
  values: SimpleMetadataProperty['values'];
  long?: boolean;
};

const SimpleValue = ({ values, long = false }: SimpleValueProps) => {
  const nonEmptyValues =
    values?.filter(v => v.value !== '' && v.value !== undefined && v.value !== null) ?? [];

  if (nonEmptyValues.length === 0) {
    return null;
  }

  if (long) {
    return (
      <div className="flex flex-col gap-1">
        {nonEmptyValues.map((v, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <p key={`${index}-${v.value}`} className="text-sm leading-relaxed text-ink">
            {v.value}
          </p>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {nonEmptyValues.map((v, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <span key={`${index}-${v.value}`} className="font-medium leading-snug">
          {v.value}
        </span>
      ))}
    </div>
  );
};

export { SimpleValue };
