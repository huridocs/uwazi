import React, { useState } from 'react';
import { Translate } from 'app/I18N';
import { MetadataFieldProps } from './types';
import { MetadataLabel } from './MetadataLabel';

type ImageProps = MetadataFieldProps & {
  values: {
    value: string;
    alt?: string;
  }[];
};

const Image = ({ label, hideLabel, translationContext, values }: ImageProps) => {
  const [errorIndices, setErrorIndices] = useState<Set<number>>(new Set());

  return (
    <div>
      <MetadataLabel label={label} hideLabel={hideLabel} translationContext={translationContext} />

      {values.map((image, index) => {
        const hasError = errorIndices.has(index);

        if (hasError) {
          return (
            <dd>
              <Translate>Error loading your image</Translate>
            </dd>
          );
        }

        return (
          <dd>
            <img
              src={image.value}
              alt={image.alt}
              onError={() => setErrorIndices(prevErrors => prevErrors.add(index))}
            />
          </dd>
        );
      })}
    </div>
  );
};

export { Image };
