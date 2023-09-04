/* eslint-disable react/no-multi-comp */
import React, { useState } from 'react';
import ReactPlayer, { ReactPlayerProps } from 'react-player';
import { PlayIcon } from '@heroicons/react/20/solid';

const DEFAULT_THUMBNAIL_COLOR = 'rgb(129 140 248)';

type MediaType = 'embedded' | 'internal' | 'invalid';

interface MediaPlayerProps extends ReactPlayerProps {
  url: string;
  thumbnail?: {
    url?: string;
    color?: string;
    fileName?: string;
  };
}

const verifyUrl = (url: string): MediaType => {
  if (!ReactPlayer.canPlay(url)) {
    return 'invalid';
  }

  if (url.startsWith('https')) {
    return 'embedded';
  }

  return 'internal';
};

const ThumbnailOverlay = ({ color, mediaName }: { color?: string; mediaName?: string }) => {
  const thumbnailColor = color || DEFAULT_THUMBNAIL_COLOR;

  return (
    <div
      className="relative w-full h-full"
      style={{
        background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(255,255,255,0.5) 50%)',
      }}
    >
      <div
        className="absolute top-0 right-0 w-full h-full"
        style={{ background: thumbnailColor, opacity: '30%' }}
      />
      <p className="p-4 font-bold text-black whitespace-nowrap opacity-1">{mediaName}</p>
    </div>
  );
};

const MediaPlayer = ({ url, width, height, thumbnail }: MediaPlayerProps) => {
  const [playing, setPlaying] = useState(false);
  const mediaType: MediaType = verifyUrl(url);

  const overlay = thumbnail?.url ? (
    thumbnail?.url
  ) : (
    <ThumbnailOverlay color={thumbnail?.color} mediaName={thumbnail?.fileName} />
  );

  const playIconColor = thumbnail?.url ? 'white' : thumbnail?.color || DEFAULT_THUMBNAIL_COLOR;

  return (
    <div style={{ width: width || '100%', height: height || '100%' }} className="relative">
      <ReactPlayer
        className="absolute top-0 left-0"
        url={url}
        playing={playing}
        width="100%"
        height="100%"
        controls
        light={mediaType === 'internal' ? overlay : false}
        playIcon={
          <PlayIcon
            role="button"
            style={{ color: playIconColor }}
            className="absolute w-1/5 min-w-[20px] max-w-[120px]"
          />
        }
        onClickPreview={() => setPlaying(true)}
      />
    </div>
  );
};

export { MediaPlayer };
