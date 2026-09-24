/* eslint-disable react/no-multi-comp */
import React, { useEffect, useRef, useState } from 'react';
import ReactPlayerModule, { ReactPlayerProps } from 'react-player';
import { PlayIcon } from '@heroicons/react/20/solid';
import { Translate } from '#app/I18N/index.js';
import { resolveDefaultExport } from '#shared/resolveDefaultExport.js';

const ReactPlayer = resolveDefaultExport(ReactPlayerModule);

type MediaType = 'embedded' | 'internal' | 'invalid';

interface MediaPlayerProps extends ReactPlayerProps {
  url: string;
  thumbnail?: {
    url?: string;
    fileName?: string;
  };
  playerRef?: React.RefObject<React.ComponentRef<typeof ReactPlayer> | null>;
  className?: string;
}

const verifyUrl = (url: string): MediaType => {
  if (ReactPlayer.canPlay && !ReactPlayer.canPlay(url)) {
    return 'invalid';
  }

  if (url.startsWith('https') || url.startsWith('http')) {
    return 'embedded';
  }

  return 'internal';
};

const ThumbnailOverlay = ({ thumbnail }: { thumbnail?: MediaPlayerProps['thumbnail'] }) => {
  if (thumbnail?.url) {
    return (
      <div
        className="relative h-full w-full"
        style={{
          backgroundImage: `url("${thumbnail.url}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <p className="overflow-hidden p-4 text-left font-normal text-ellipsis whitespace-nowrap text-gray-100">
          {thumbnail.fileName}
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-warm">
      <p className="overflow-hidden p-4 text-left font-normal text-ellipsis whitespace-nowrap text-ink-muted">
        {thumbnail?.fileName}
      </p>
    </div>
  );
};

const filePlayerConfig = (
  objectFit: React.CSSProperties['objectFit'] | undefined,
  config: ReactPlayerProps['config'],
  playerHeight: number
): ReactPlayerProps['config'] => ({
  ...config,
  facebook: { attributes: { 'data-height': playerHeight }, ...config?.facebook },
  ...(objectFit
    ? {
        file: {
          ...config?.file,
          attributes: {
            ...config?.file?.attributes,
            style: {
              width: '100%',
              height: '100%',
              objectFit,
              ...config?.file?.attributes?.style,
            },
          },
        },
      }
    : {}),
});

const MediaPlayer = ({
  url,
  width,
  height,
  thumbnail,
  playerRef,
  className,
  style,
  config,
  ...props
}: MediaPlayerProps) => {
  const [playing, setPlaying] = useState(false);
  const [playerHeight, setPlayerHeight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const mediaType: MediaType = verifyUrl(url);

  const playIconColor = thumbnail?.url
    ? 'text-gray-100 hover:text-white'
    : 'text-ink-muted hover:text-ink';

  const renderThumbnail =
    mediaType === 'internal' ? <ThumbnailOverlay thumbnail={thumbnail} /> : false;

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return undefined;
    }

    const updateHeight = () => {
      setPlayerHeight(node.clientHeight);
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      style={{ width: width || '100%', height: height || '100%' }}
      className={`relative ${className ?? ''}`}
      ref={containerRef}
      data-testid="media-player-container"
    >
      {mediaType === 'invalid' && (
        <div className="flex absolute top-0 left-0 justify-center items-center p-4 w-full h-full bg-gray-50 rounded-sm border">
          <p className="text-center">
            <Translate>This file type is not supported on media fields</Translate>
          </p>
        </div>
      )}

      {mediaType !== 'invalid' && playerHeight ? (
        <ReactPlayer
          ref={playerRef}
          className="absolute top-0 left-0"
          width="100%"
          height="100%"
          controls
          url={url}
          playing={playing}
          light={renderThumbnail}
          config={filePlayerConfig(style?.objectFit, config, playerHeight)}
          playIcon={
            <PlayIcon
              className={`absolute w-1/5 min-w-5 max-w-30 ${playIconColor}`}
              aria-label="Play video"
            />
          }
          onClickPreview={() => !playing && setPlaying(true)}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...props}
        />
      ) : (
        <div />
      )}
    </div>
  );
};

export { MediaPlayer };
