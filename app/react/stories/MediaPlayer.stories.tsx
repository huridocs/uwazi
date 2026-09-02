import React from 'react';
import preview from '#storybook/preview';
import { storyExtend } from '#app/stories/storyExtend.js';
import { MediaPlayer } from '#V2/Components/UI/index.js';

const meta = preview.meta({
  title: 'Components/MediaPlayer',
  component: MediaPlayer,
});

const Primary = meta.story({
  args: { width: '700px', height: '350px', url: 'https://www.youtube.com/watch?v=a3ICNMQW7Ok' },
  render: args => (
    <div className="tw-content">
      <div className="p-4 rounded-sm border">
        <MediaPlayer
          url={args.url}
          width={args.width}
          height={args.height}
          thumbnail={args.thumbnail}
        />
      </div>
    </div>
  ),
});

const Embedded = storyExtend(Primary, {
  args: { width: '700px', height: '350px', url: 'https://www.youtube.com/watch?v=a3ICNMQW7Ok' },
});

const LocalFile = storyExtend(Primary, {
  args: {
    width: '700px',
    height: '350px',
    url: '/short-video.mp4',
    thumbnail: { fileName: 'Short video' },
  },
});

const LocalFileWithThumbnail = storyExtend(Primary, {
  args: {
    width: '700px',
    height: '350px',
    url: '/short-video.mp4',
    thumbnail: { url: '/short-video-thumbnail.jpg', fileName: 'Short video with thumbnail' },
  },
});

const InvalidMedia = storyExtend(Primary, {
  args: { width: '700px', height: '350px', url: '/sample.pdf' },
});

export { Embedded, LocalFile, LocalFileWithThumbnail, InvalidMedia };
