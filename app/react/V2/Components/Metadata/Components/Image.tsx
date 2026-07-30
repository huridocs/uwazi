import React, { useState } from 'react';
import { Translate } from '#app/I18N/index.js';
import { ImageMetadataProperty } from '#V2/formatters/types.js';

type ImageProps = {
  values: ImageMetadataProperty['values'];
  imageStyle?: 'contain' | 'cover';
};

const Image = ({ values, imageStyle }: ImageProps) => {
  const [errorIndices, setErrorIndices] = useState<Set<number>>(new Set());

  if (!values?.length) {
    return null;
  }

  if (values.length && !values[0].value) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
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
              className="m-auto max-h-96 max-w-full"
              style={{
                objectFit: imageStyle ?? 'fill',
              }}
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
