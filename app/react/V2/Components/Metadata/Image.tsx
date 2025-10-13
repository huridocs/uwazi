import React, { useState } from 'react';
import { Translate } from 'app/I18N';
import { MetadataFieldProps } from './types';
import { MetadataLabel } from './MetadataLabel';
import { MetadataCard } from './MetadataCard';

type ImageProps = MetadataFieldProps & {
  values: {
    value: string;
    alt?: string;
  }[];
  imageStyle?: 'contain' | 'cover';
};

const Image = ({ label, hideLabel, translationContext, values, imageStyle }: ImageProps) => {
  const [errorIndices, setErrorIndices] = useState<Set<number>>(new Set());

  return (
    <MetadataCard>
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
          <dd className="flex justify-center">
            <img
              style={{
                objectFit: imageStyle ?? 'fill',
              }}
              src={image.value}
              alt={image.alt}
              onError={() => setErrorIndices(prevErrors => prevErrors.add(index))}
            />
          </dd>
        );
      })}
    </MetadataCard>
  );
};

export { Image };
