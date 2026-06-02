import React, { useId, useRef } from 'react';
import { PlayIcon } from '@heroicons/react/20/solid';
import { t } from '#app/I18N/index.js';
import { MediaMetadataProperty } from '#V2/formatters/types.js';
import { MetadataFieldProps } from './MetadataFieldPropsType.js';
import { PropertyLabel } from './PropertyLabel.js';
import { MediaPlayer } from '../../UI/index.js';
import { MetadataCard } from './MetadataCard.js';
import { COMPACT_METADATA_FIELD_LAYOUT } from '../metadataPropertyLayout.js';

type MediaProps = MetadataFieldProps & {
  values: MediaMetadataProperty['values'];
  width?: number;
  height?: number;
};

type PlayerRef = NonNullable<React.ComponentProps<typeof MediaPlayer>['playerRef']>;
type PlayerInstance = PlayerRef extends React.RefObject<infer T> ? T : never;

const Media = ({
  label,
  values,
  hideLabel,
  translationContext,
  className,
  width = 500,
  height = 300,
}: MediaProps) => {
  const baseId = useId();
  const playerRefs = useRef<React.RefObject<PlayerInstance>[]>([]);
  if (playerRefs.current.length !== values.length) {
    playerRefs.current = Array.from({ length: values.length }, () =>
      React.createRef<PlayerInstance>()
    );
  }

  const nonEmptyValues = values?.filter(v => v.value) ?? [];

  if (nonEmptyValues.length === 0) {
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
      <dd className="flex flex-col gap-4">
        {nonEmptyValues.map(({ value, alt, timelinks = [] }, index) => {
          const playerRef = playerRefs.current[index];
          const handleTimelinkClick = (time: number) => {
            playerRef?.current?.seekTo(time, 'seconds');
          };

          const figId = `${baseId}-${index}`;

          return (
            // eslint-disable-next-line react/no-array-index-key
            <div key={index} className="flex flex-col items-center gap-2">
              <figure
                aria-labelledby={figId}
                className="w-full bg-(--color-theme-surface-warm) rounded-md"
              >
                <MediaPlayer
                  className="m-auto"
                  playerRef={playerRef}
                  url={value}
                  width={width}
                  height={height}
                />
                {alt && (
                  <figcaption className="sr-only" id={figId}>
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
            </div>
          );
        })}
      </dd>
    </MetadataCard>
  );
};

export { Media };
