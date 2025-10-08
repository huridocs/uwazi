import React from 'react';
import { MetadataFieldProps } from './types';
import { MetadataLabel } from './MetadataLabel';
import { MediaPlayer } from '../UI';

type MediaProps = MetadataFieldProps & { values: { value: string; alt?: string }[] };

const Media = ({ label, values, hideLabel, translationContext }: MediaProps) => (
  <div>
    <MetadataLabel label={label} translationContext={translationContext} hideLabel={hideLabel} />
    {values.map(value => (
      <dd>
        <figure aria-labelledby={label}>
          <MediaPlayer url={value.value} width={500} height={300} />
          {value.alt && (
            <figcaption className="sr-only" id={label}>
              {value.alt}
            </figcaption>
          )}
        </figure>
      </dd>
    ))}
  </div>
);

export { Media };
