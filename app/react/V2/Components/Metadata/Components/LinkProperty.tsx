import React, { useMemo } from 'react';
import { LinkMetadataProperty } from '#V2/formatters/types.js';

type LinkPropertyProps = {
  values: LinkMetadataProperty['values'];
};

const LinkProperty = ({ values }: LinkPropertyProps) => {
  const noValues = useMemo(
    () => values.length === 0 || values.every(value => !value.value || value.value === ''),
    [values]
  );

  if (noValues) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1 font-medium leading-snug">
      {values.map((value, index) => (
        <a
          // eslint-disable-next-line react/no-array-index-key
          key={`${index}-${value.value}`}
          className="underline"
          href={value.value}
          target="_blank"
          rel="noreferrer"
        >
          {value.label || value.value}
        </a>
      ))}
    </div>
  );
};

export { LinkProperty };
