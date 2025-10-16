import React, { useState } from 'react';
import { Translate } from 'app/I18N';
import { MetadataFieldProps } from './types';
import { PropertyLabel } from './PropertyLabel';
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
      <dt>
        <PropertyLabel
          label={label}
          translationContext={translationContext}
          hideLabel={hideLabel}
        />
      </dt>

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
              key={image.value}
              onError={() => setErrorIndices(prevErrors => prevErrors.add(index))}
            />
          </dd>
        );
      })}
    </MetadataCard>
  );
};

export { Image };
