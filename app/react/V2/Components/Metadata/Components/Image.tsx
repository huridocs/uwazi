import React, { useState } from 'react';
import { Translate } from '#app/I18N/index.js';
import { ImageMetadataProperty } from '#V2/formatters/types.js';
import { MetadataFieldProps } from './MetadataFieldPropsType.js';
import { PropertyLabel } from './PropertyLabel.js';
import { MetadataCard } from './MetadataCard.js';
import { COMPACT_METADATA_FIELD_LAYOUT } from '../metadataPropertyLayout.js';

type ImageProps = MetadataFieldProps & {
  values: ImageMetadataProperty['values'];
  imageStyle?: 'contain' | 'cover';
};

const Image = ({
  label,
  hideLabel,
  translationContext,
  values,
  imageStyle,
  className,
}: ImageProps) => {
  const [errorIndices, setErrorIndices] = useState<Set<number>>(new Set());

  if (!values?.length) {
    return null;
  }

  if (values.length && !values[0].value) {
    return null;
  }

  return (
    <MetadataCard className={className ?? COMPACT_METADATA_FIELD_LAYOUT}>
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
          <dd className="w-full min-w-0 max-w-full overflow-hidden rounded-md bg-(--color-theme-surface-warm)">
            <img
              className="m-auto max-h-96 max-w-full"
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
