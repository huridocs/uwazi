import React, { useRef } from 'react';
import ReactPlayer from 'react-player';
import { t } from 'app/I18N';
import { MetadataFieldProps } from './types';
import { MetadataLabel } from './MetadataLabel';
import { MediaPlayer } from '../UI';
import { MetadataCard } from './MetadataCard';

type Timelink = {
  time: string;
  label: string;
};

type MediaProps = MetadataFieldProps & {
  values: {
    value: string;
    timelinks?: Timelink[];
    alt?: string;
  }[];
};

const parseTimeToSeconds = (timeString: string): number => {
  const parts = timeString.split(':').map(Number);
  if (parts.length === 3) {
    const [h, m, s] = parts;
    return h * 3600 + m * 60 + s;
  }
  if (parts.length === 2) {
    const [m, s] = parts;
    return m * 60 + s;
  }
  return Number(timeString) || 0;
};

const Media = ({ label, values, hideLabel, translationContext }: MediaProps) => {
  const { value, alt, timelinks = [] } = values[0];
  const playerRef = useRef<ReactPlayer>(null);

  const handleTimelinkClick = (timeString: string) => {
    const seconds = parseTimeToSeconds(timeString);
    playerRef.current?.seekTo(seconds, 'seconds');
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
