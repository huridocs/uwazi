import React, { useState } from 'react';
import { Translate } from 'app/I18N';
import { ImageMetadataProperty } from 'V2/domain/entities/types';
import { MetadataFieldProps } from './types';
import { PropertyLabel } from './PropertyLabel';
import { MetadataCard } from './MetadataCard';

type ImageProps = MetadataFieldProps & {
  values: ImageMetadataProperty['values'];
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
          <dd className="w-full rounded-md bg-gray-100">
            <img
              className="m-auto max-h-96"
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
