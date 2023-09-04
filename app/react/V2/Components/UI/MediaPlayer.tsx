/* eslint-disable react/no-multi-comp */
import React from 'react';
import ReactPlayer, { ReactPlayerProps } from 'react-player';
import { PlayIcon } from '@heroicons/react/20/solid';

type MediaType = 'embedded' | 'internal' | 'invalid';

interface MediaPlayerProps extends ReactPlayerProps {
  url: string;
  thumbnail?: {
    url?: string;
    color?: string;
    title?: string;
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

const ThumbnailOverlay = () => {
  return <>Yay my ovelay</>;
};

const MediaPlayer = ({ url, width, height, thumbnail }: MediaPlayerProps) => {
  const mediaType: MediaType = verifyUrl(url);

  return (
    <ReactPlayer
      url={url}
      width={width || '100%'}
      height={height || '100%'}
      controls
      light={mediaType === 'internal' ? <ThumbnailOverlay /> : false}
      playIcon={<PlayIcon className="w-1/5 min-w-[20px] max-w-[120px]" />}
    />
  );
};

export { MediaPlayer };
