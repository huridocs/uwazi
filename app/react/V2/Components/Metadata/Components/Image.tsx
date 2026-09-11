import React, { useState } from 'react';
import { Translate } from '#app/I18N/index.js';
import { ImageMetadataProperty } from '#V2/formatters/types.js';

type ImageProps = {
  values: ImageMetadataProperty['values'];
  imageStyle?: 'contain' | 'cover';
  density?: 'default' | 'compact';
  fullWidth?: boolean;
};

const MEDIA_SURFACE =
  'w-full min-w-0 max-w-full overflow-hidden rounded-md bg-(--color-theme-surface-warm)';

const Image = ({
  values,
  imageStyle = 'cover',
  density = 'default',
  fullWidth = false,
}: ImageProps) => {
  const [errorIndices, setErrorIndices] = useState<Set<number>>(new Set());
  const cover = imageStyle === 'cover';
  const compact = density === 'compact';

  if (!values.length || !values[0].value) {
    return null;
  }

  return (
    <div className={`flex w-full min-w-0 flex-col gap-2${compact ? '' : ' h-full min-h-0 flex-1'}`}>
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
            className={`${MEDIA_SURFACE}${compact ? '' : ' h-full min-h-0'}`}
          >
            <img
              className={`${cover ? 'block ' : ''}${cover || fullWidth ? 'w-full' : 'm-auto max-w-full'} ${
                compact ? 'max-h-32' : 'h-full min-h-0'
              }`}
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

export { Image, MEDIA_SURFACE };
