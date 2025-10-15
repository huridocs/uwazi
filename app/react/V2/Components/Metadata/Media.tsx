import React, { useRef } from 'react';
import ReactPlayer from 'react-player';
import { t } from 'app/I18N';
import { MetadataFieldProps } from './types';
import { MetadataLabel } from './MetadataLabel';
import { MediaPlayer } from '../UI';
import { MetadataCard } from './MetadataCard';

type Timelink = {
  time: number;
  label: string;
};

type MediaProps = MetadataFieldProps & {
  values: {
    value: string;
    timelinks?: Timelink[];
    alt?: string;
  }[];
};

const Media = ({ label, values, hideLabel, translationContext }: MediaProps) => {
  const { value, alt, timelinks = [] } = values[0];
  const playerRef = useRef<ReactPlayer>(null);

  const handleTimelinkClick = (time: number) => {
    playerRef.current?.seekTo(time, 'seconds');
  };

  return (
    <MetadataCard>
      <MetadataLabel label={label} translationContext={translationContext} hideLabel={hideLabel} />
      <dd className="flex flex-col items-center">
        <figure aria-labelledby={label}>
          <MediaPlayer playerRef={playerRef} url={value} width={500} height={300} />
          {alt && (
            <figcaption className="sr-only" id={label}>
              {alt}
            </figcaption>
          )}
        </figure>

        {timelinks.length > 0 && (
          <nav aria-label={t('System', 'Timelinks', null, false)}>
            <ul className="flex flex-wrap justify-center gap-2">
              {timelinks.map(({ time, label: timelinkLabel }) => (
                <li key={timelinkLabel + time}>
                  <button type="button" onClick={() => handleTimelinkClick(time)}>
                    {timelinkLabel}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </dd>
    </MetadataCard>
  );
};

export { Media };
