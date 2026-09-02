import React, { useState } from 'react';
import { Translate } from '#app/I18N/index.js';
import { ImageMetadataProperty } from '#V2/formatters/types.js';

type ImageProps = {
  values: ImageMetadataProperty['values'];
  imageStyle?: 'contain' | 'cover';
  density?: 'default' | 'compact';
  frame?: 'natural' | 'video';
};

const Image = ({ values, imageStyle, density = 'default', frame = 'natural' }: ImageProps) => {
  const [errorIndices, setErrorIndices] = useState<Set<number>>(new Set());
  const videoFrame = frame === 'video';
  const maxHeightClass = density === 'compact' ? 'max-h-32' : 'max-h-96';

  if (!values?.length || !values[0].value) {
    return null;
  }

  let imgClassName = `m-auto ${maxHeightClass} max-w-full`;
  if (videoFrame) {
    imgClassName = 'absolute inset-0 h-full w-full';
  } else if (density === 'compact') {
    imgClassName = `block w-full ${maxHeightClass}`;
  }

  return (
    <div className={`flex w-full min-w-0 flex-col gap-2${videoFrame ? ' min-h-0 flex-1' : ''}`}>
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
            className={`w-full min-w-0 max-w-full overflow-hidden rounded-md bg-(--color-theme-surface-warm) ${
              videoFrame ? 'relative min-h-0 flex-1 aspect-video' : ''
            }`.trim()}
          >
            <img
              className={imgClassName}
              style={{
                objectFit: imageStyle ?? (density === 'compact' ? 'contain' : 'fill'),
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
