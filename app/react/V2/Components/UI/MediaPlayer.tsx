/* eslint-disable react/no-multi-comp */
import React, { useEffect, useRef, useState } from 'react';
import ReactPlayer, { ReactPlayerProps } from 'react-player';
import { PlayIcon } from '@heroicons/react/20/solid';
import { Translate } from 'app/I18N';

type MediaType = 'embedded' | 'internal' | 'invalid';

interface MediaPlayerProps extends ReactPlayerProps {
  url: string;
  thumbnail?: {
    url?: string;
    fileName?: string;
  };
}

const verifyUrl = (url: string): MediaType => {
  if (!ReactPlayer.canPlay(url)) {
    return 'invalid';
  }

  if (url.startsWith('https') || url.startsWith('http')) {
    return 'embedded';
  }

  return 'internal';
};

const ThumbnailOverlay = ({ thumbnail }: { thumbnail?: MediaPlayerProps['thumbnail'] }) => {
  const overlayBackgroundStyle = thumbnail?.url
    ? {
        backgroundImage: `url("${thumbnail.url}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : { background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 6%, rgba(156,163,175,0.6) 50%)' };

  const mediaTitleStyle = thumbnail?.url ? 'text-gray-100' : '';

  return (
    <div className="relative w-full h-full" style={overlayBackgroundStyle}>
      <p
        className={`overflow-hidden p-4 font-normal text-left overflow-ellipsis whitespace-nowrap opacity-1 ${mediaTitleStyle}`}
      >
        {thumbnail?.fileName}
      </p>
    </div>
  );
};

const MediaPlayer = ({ url, width, height, thumbnail }: MediaPlayerProps) => {
  const [playing, setPlaying] = useState(false);
  const [playerHeight, setPlayerHeight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const mediaType: MediaType = verifyUrl(url);

  const playIconColor = thumbnail?.url
    ? 'text-gray-100 hover:text-white'
    : 'text-gray-500 hover:text-gray-700';

  const renderThumbnail =
    mediaType === 'internal' ? <ThumbnailOverlay thumbnail={thumbnail} /> : false;

  useEffect(() => {
    if (containerRef.current?.clientHeight) {
      setPlayerHeight(containerRef.current.clientHeight);
    }
  }, []);

  return (
    <div
      style={{ width: width || '100%', height: height || '100%' }}
      className="relative"
      ref={containerRef}
    >
      {mediaType === 'invalid' && (
        <div className="flex absolute top-0 left-0 justify-center items-center p-4 w-full h-full bg-gray-50 rounded border">
          <p className="text-center">
            <Translate>This file type is not supported on media fields</Translate>
          </p>
        </div>
      )}

      {mediaType === 'internal' && (
        <video controls className="absolute top-0 left-0" width="100%" height="100%">
          <source src={url} />
          Your browser does not support the video tag.
          <track kind="captions" src="some" srcLang="somelang" />
        </video>
      )}

      {mediaType === 'embedded' && playerHeight ? (
        <ReactPlayer
          className="absolute top-0 left-0"
          width="100%"
          height="100%"
          controls
          url={url}
          playing={playing}
          light={renderThumbnail}
          config={{
            facebook: {
              attributes: {
                'data-height': playerHeight,
              },
            },
          }}
          playIcon={
            <PlayIcon className={`absolute w-1/5 min-w-[20px] max-w-[120px] ${playIconColor}`} />
          }
          onClickPreview={() => !playing && setPlaying(true)}
        />
      ) : (
        <div />
      )}
    </div>
  );
};

export { MediaPlayer };
