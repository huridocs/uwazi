import React, { useId, useRef } from 'react';
import { PlayIcon } from '@heroicons/react/20/solid';
import { t } from '#app/I18N/index.js';
import { MediaMetadataProperty } from '#V2/formatters/types.js';
import { getMimetypeFromUrl } from '#V2/shared/formatHelpers.js';
import { MediaPlayer } from '../../UI/index.js';
import { Image, MEDIA_SURFACE } from './Image.js';

type MediaProps = {
  values: MediaMetadataProperty['values'];
  width?: number | string;
  height?: number | string;
  frame?: 'natural' | 'video';
  imageStyle?: 'contain' | 'cover';
  fullWidth?: boolean;
  density?: 'default' | 'compact';
};

type PlayerRef = NonNullable<React.ComponentProps<typeof MediaPlayer>['playerRef']>;
type PlayerInstance = PlayerRef extends React.RefObject<infer T> ? T : never;

const isImageMedia = (value: string, mimetype?: string, fileType?: string) =>
  fileType === 'image' ||
  Boolean(mimetype?.startsWith('image/')) ||
  getMimetypeFromUrl(value).startsWith('image/');

const Media = ({
  values,
  width = '100%',
  height = 300,
  frame = 'natural',
  imageStyle = 'cover',
  fullWidth = false,
  density = 'default',
}: MediaProps) => {
  const baseId = useId();
  const playerRefs = useRef<React.RefObject<PlayerInstance>[]>([]);
  if (playerRefs.current.length !== values.length) {
    playerRefs.current = Array.from({ length: values.length }, () =>
      React.createRef<PlayerInstance>()
    );
  }

  const nonEmptyValues = values.filter(v => v.value);
  const cover = imageStyle === 'cover';
  const framed = frame === 'video';
  const compact = density === 'compact';
  const stack = compact
    ? 'flex min-w-0 max-w-full flex-col'
    : 'flex h-full min-h-0 min-w-0 max-w-full flex-1 flex-col';

  if (nonEmptyValues.length === 0) {
    return null;
  }

  return (
    <div className={`${stack} gap-4 overflow-hidden`}>
      {nonEmptyValues.map(({ value, alt, timelinks = [], mimetype, fileType }, index) => {
        if (isImageMedia(value, mimetype, fileType)) {
          return (
            <Image
              key={value}
              values={[{ value, alt }]}
              imageStyle={imageStyle}
              density={density}
              fullWidth={fullWidth}
            />
          );
        }

        const playerRef = playerRefs.current[index];
        const handleTimelinkClick = (time: number) => {
          playerRef?.current?.seekTo(time, 'seconds');
        };

        const figId = `${baseId}-${index}`;
        const hasTimelinks = timelinks.length > 0;
        const box = compact
          ? 'max-h-[140px]'
          : `min-h-48 ${hasTimelinks ? 'shrink-0' : 'h-full min-h-0'}${framed && cover ? ' relative' : ''}`;
        return (
          <div key={value} className={`${stack} gap-2`}>
            <figure aria-labelledby={figId} className={`${MEDIA_SURFACE} ${box}`}>
              <MediaPlayer
                className={
                  framed && cover ? 'absolute inset-0 h-full w-full' : 'h-full w-full max-w-full'
                }
                playerRef={playerRef}
                url={value}
                width={width}
                height={framed ? '100%' : height}
                style={framed ? { objectFit: cover ? 'cover' : 'contain' } : undefined}
              />
              {alt && (
                <figcaption className="sr-only" id={figId}>
                  {alt}
                </figcaption>
              )}
            </figure>

            {hasTimelinks && (
              <nav className="min-h-0 w-full" aria-label={t('System', 'Timelinks', null, false)}>
                <ul className="flex max-h-32 flex-col gap-2 overflow-y-auto">
                  {timelinks.map(({ time, hh, mm, ss, label: timelinkLabel }) => (
                    <li key={timelinkLabel + time}>
                      <button
                        className="flex flex-row flex-nowrap"
                        type="button"
                        onClick={() => handleTimelinkClick(time)}
                        aria-label={`${hh} ${mm} ${ss} : ${timelinkLabel}`}
                      >
                        <PlayIcon className="h-4 w-4" />
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
    </div>
  );
};

export { Media };
