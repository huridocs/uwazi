import React, { useEffect, useRef, useState } from 'react';
import { PlayIcon } from '@heroicons/react/20/solid';
import { Translate } from 'app/I18N';

type MediaType = 'embedded' | 'internal' | 'invalid';

interface VideoPlayerProps {
  url: string;
  width?: string | number;
  height?: string | number;
  thumbnail?: {
    url?: string;
    fileName?: string;
  };
  className?: string;
  onDuration?: (duration: number) => void;
}

const isExternalPlatform = (url: string): boolean => {
  const youtubePattern =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const vimeoPattern = /(?:vimeo\.com\/)(?:.*\/)?(\d+)/;
  return youtubePattern.test(url) || vimeoPattern.test(url);
};

const getYouTubeEmbedUrl = (url: string): string | null => {
  const youtubePattern =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(youtubePattern);
  if (match) {
    return `https://www.youtube.com/embed/${match[1]}`;
  }
  return null;
};

const getVimeoEmbedUrl = (url: string): string | null => {
  const vimeoPattern = /(?:vimeo\.com\/)(?:.*\/)?(\d+)/;
  const match = url.match(vimeoPattern);
  if (match) {
    return `https://player.vimeo.com/video/${match[1]}`;
  }
  return null;
};

const verifyUrl = (url: string): MediaType => {
  if (!url) {
    return 'invalid';
  }

  if (isExternalPlatform(url)) {
    return 'embedded';
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    const videoExtensions = /\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv|m4v)(\?|$)/i;
    if (videoExtensions.test(url)) {
      return 'internal';
    }
    return 'internal';
  }

  return 'internal';
};

const ThumbnailOverlay = ({ thumbnail }: { thumbnail?: VideoPlayerProps['thumbnail'] }) => {
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
      {thumbnail?.fileName && (
        <p
          className={`overflow-hidden p-4 font-normal text-left text-ellipsis whitespace-nowrap opacity-1 ${mediaTitleStyle}`}
        >
          {thumbnail.fileName}
        </p>
      )}
    </div>
  );
};

const VideoPlayer = ({
  url,
  width,
  height,
  thumbnail,
  className,
  onDuration,
}: VideoPlayerProps) => {
  const [playing, setPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const mediaType: MediaType = verifyUrl(url);

  const playIconColor = thumbnail?.url
    ? 'text-gray-100 hover:text-white'
    : 'text-gray-500 hover:text-gray-700';

  const shouldShowThumbnail = mediaType === 'internal' && !playing && thumbnail;

  useEffect(() => {
    if (videoRef.current && onDuration) {
      const handleLoadedMetadata = () => {
        if (videoRef.current?.duration && Number.isFinite(videoRef.current.duration)) {
          onDuration(videoRef.current.duration);
        }
      };
      const video = videoRef.current;
      if (video.readyState >= 1 && video.duration && Number.isFinite(video.duration)) {
        onDuration(video.duration);
      } else {
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        return () => {
          video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        };
      }
    }
  }, [onDuration, url]);

  const handlePlayClick = () => {
    if (mediaType === 'internal' && videoRef.current) {
      setPlaying(true);
      setShowControls(true);
      videoRef.current.play().catch(() => {});
    }
  };

  if (mediaType === 'invalid') {
    return (
      <div className="flex absolute top-0 left-0 justify-center items-center p-4 w-full h-full bg-gray-50 rounded-sm border">
        <p className="text-center">
          <Translate>This file type is not supported on media fields</Translate>
        </p>
      </div>
    );
  }

  if (mediaType === 'embedded') {
    const youtubeEmbed = getYouTubeEmbedUrl(url);
    const vimeoEmbed = getVimeoEmbedUrl(url);

    if (youtubeEmbed) {
      return (
        <div
          style={{ width: width || '100%', height: height || '100%' }}
          className={`relative ${className ?? ''}`}
          ref={containerRef}
        >
          <iframe
            src={youtubeEmbed}
            className="absolute top-0 left-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            title="YouTube video player"
          />
        </div>
      );
    }

    if (vimeoEmbed) {
      return (
        <div
          style={{ width: width || '100%', height: height || '100%' }}
          className={`relative ${className ?? ''}`}
          ref={containerRef}
        >
          <iframe
            src={vimeoEmbed}
            className="absolute top-0 left-0 w-full h-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            title="Vimeo video player"
          />
        </div>
      );
    }

    return (
      <div
        style={{ width: width || '100%', height: height || '100%' }}
        className={`relative ${className ?? ''}`}
        ref={containerRef}
      >
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={videoRef}
          className="absolute top-0 left-0 w-full h-full"
          controls
          playsInline
          src={url}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
      </div>
    );
  }

  return (
    <div
      style={{ width: width || '100%', height: height || '100%' }}
      className={`relative ${className ?? ''}`}
      ref={containerRef}
    >
      {shouldShowThumbnail && (
        <>
          <ThumbnailOverlay thumbnail={thumbnail} />
          <button
            type="button"
            onClick={handlePlayClick}
            className="absolute inset-0 flex items-center justify-center z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            aria-label="Play video"
          >
            <PlayIcon className={`w-1/5 min-w-[20px] max-w-[120px] ${playIconColor}`} />
          </button>
        </>
      )}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        className={`absolute top-0 left-0 w-full h-full ${shouldShowThumbnail ? 'opacity-0 pointer-events-none' : ''}`}
        controls={showControls || !shouldShowThumbnail}
        playsInline
        poster={thumbnail?.url}
        src={url}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
    </div>
  );
};

export { VideoPlayer };
