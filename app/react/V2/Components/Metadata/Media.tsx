import React from 'react';
import { MetadataFieldProps } from './types';
import { MetadataLabel } from './MetadataLabel';
import { MediaPlayer } from '../UI';
import { MetadataCard } from './MetadataCard';

type MediaProps = MetadataFieldProps & { values: { value: string; alt?: string }[] };

const Media = ({ label, values, hideLabel, translationContext }: MediaProps) => {
  const { value, alt } = values[0];

  return (
    <MetadataCard>
      <MetadataLabel label={label} translationContext={translationContext} hideLabel={hideLabel} />
      <dd className="flex justify-center">
        <figure aria-labelledby={label}>
          <MediaPlayer url={value} width={500} height={300} />
          {alt && (
            <figcaption className="sr-only" id={label}>
              {alt}
            </figcaption>
          )}
        </figure>
      </dd>
    </MetadataCard>
  );
};

export { Media };
