import React, { useState } from 'react';
import { Translate } from '#app/I18N/index.js';
import { ImageMetadataProperty } from '#V2/formatters/types.js';

type ImageProps = {
  values: ImageMetadataProperty['values'];
  imageStyle?: 'contain' | 'cover';
  density?: 'default' | 'compact';
  fullWidth?: boolean;
};

const imageMaxHeightClass = (density: 'default' | 'compact', fullWidth: boolean) => {
  if (density === 'compact') {
    return 'max-h-32';
  }
  return fullWidth ? 'max-h-96' : 'max-h-48';
};

const Image = ({
  values,
  imageStyle = 'cover',
  density = 'default',
  fullWidth = false,
}: ImageProps) => {
  const [errorIndices, setErrorIndices] = useState<Set<number>>(new Set());
  const maxHeightClass = imageMaxHeightClass(density, fullWidth);
  const cover = imageStyle === 'cover';

  if (!values?.length || !values[0].value) {
    return null;
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-2">
      {values.map((image, index) => {
        const hasError = errorIndices.has(index);

        if (hasError) {
          return (
            <div key={image.value || index}>
              <Translate>Error loading your image</Translate>
            </div>
          );
        }

        return (
          <div
            key={image.value || index}
            className="w-full min-w-0 max-w-full overflow-hidden rounded-md bg-(--color-theme-surface-warm)"
          >
            <img
              className={
                cover ? `block w-full ${maxHeightClass}` : `m-auto ${maxHeightClass} max-w-full`
              }
              style={{ objectFit: cover ? 'cover' : 'contain' }}
              src={image.value}
              alt={image.alt}
              onError={() => setErrorIndices(prevErrors => prevErrors.add(index))}
            />
          </div>
        );
      })}
    </div>
  );
};

export { Image };
