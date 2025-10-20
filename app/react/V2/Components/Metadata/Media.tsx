import React, { useRef } from 'react';
import ReactPlayer from 'react-player';
import { PlayIcon } from '@heroicons/react/20/solid';
import { t } from 'app/I18N';
import { MediaMetadataProperty } from 'V2/domain/entities/types';
import { MetadataFieldProps } from './types';
import { PropertyLabel } from './PropertyLabel';
import { MediaPlayer } from '../UI';
import { MetadataCard } from './MetadataCard';

type MediaProps = MetadataFieldProps & {
  values: MediaMetadataProperty['values'];
  width?: number;
  height?: number;
};

const Media = ({
  label,
  values,
  hideLabel,
  translationContext,
  width = 500,
  height = 300,
}: MediaProps) => {
  const { value, alt, timelinks = [] } = values[0];
  const playerRef = useRef<ReactPlayer>(null);

  const handleTimelinkClick = (time: number) => {
    playerRef.current?.seekTo(time, 'seconds');
  };

  return (
    <MetadataCard>
      <dt>
        <PropertyLabel
          label={label}
          translationContext={translationContext}
          hideLabel={hideLabel}
        />
      </dt>
      <dd className="flex flex-col items-center gap-2">
        <figure aria-labelledby={label} className="w-full bg-gray-100 rounded-md">
          <MediaPlayer
            className="m-auto"
            playerRef={playerRef}
            url={value}
            width={width}
            height={height}
          />
          {alt && (
            <figcaption className="sr-only" id={label}>
              {alt}
            </figcaption>
          )}
        </figure>

        {timelinks.length > 0 && (
          <nav className="w-full" aria-label={t('System', 'Timelinks', null, false)}>
            <ul className="flex flex-col gap-2">
              {timelinks.map(({ time, hh, mm, ss, label: timelinkLabel }) => (
                <li key={timelinkLabel + time}>
                  <button
                    className="flex flex-row flex-nowrap"
                    type="button"
                    onClick={() => handleTimelinkClick(time)}
                    aria-label={`${hh} ${mm} ${ss} : ${timelinkLabel}`}
                  >
                    <PlayIcon className="w-4 h-4" />
                    {`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`}{' '}
                    - {timelinkLabel}
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
