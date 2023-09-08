/* eslint-disable react/no-multi-comp */
import React, { useState } from 'react';
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

  if (url.startsWith('https')) {
    return 'embedded';
  }

  return 'internal';
};

const ThumbnailOverlay = ({ mediaName }: { mediaName?: string }) => {
  const bgColor = '';

  return (
    <div
      className="relative w-full h-full"
      style={{
        background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 10%, rgba(156,163,175,0.6) 50%)',
      }}
    >
      <p className="overflow-hidden p-4 font-normal text-left overflow-ellipsis whitespace-nowrap opacity-1">
        {mediaName}
      </p>
    </div>
  );
};

const MediaPlayer = ({ url, width, height, thumbnail }: MediaPlayerProps) => {
  const [playing, setPlaying] = useState(false);
  const mediaType: MediaType = verifyUrl(url);

  const overlay = thumbnail?.url ? (
    thumbnail?.url
  ) : (
    <ThumbnailOverlay mediaName={thumbnail?.fileName} />
  );

  const playIconColor = thumbnail?.url
    ? 'text-gray-100 hover:text-white'
    : 'text-gray-500 hover:text-gray-700';

  return (
    <div style={{ width: width || '100%', height: height || '100%' }} className="relative">
      {mediaType === 'invalid' ? (
        <div className="flex absolute top-0 left-0 justify-center items-center p-4 w-full h-full bg-gray-50 rounded border">
          <p className="text-center">
            <Translate>This file type is not supported on media fields</Translate>
          </p>
        </div>
      ) : (
        <ReactPlayer
          className="absolute top-0 left-0"
          url={url}
          playing={playing}
          width="100%"
          height="100%"
          controls
          light={mediaType === 'internal' ? overlay : false}
          playIcon={
            <PlayIcon className={`absolute w-1/5 min-w-[20px] max-w-[120px] ${playIconColor}`} />
          }
          onClickPreview={() => !playing && setPlaying(true)}
          stopOnUnmount
        />
      )}
    </div>
  );
};

export { MediaPlayer };
