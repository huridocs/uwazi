import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { MediaPlayer } from 'V2/Components/UI';

const meta: Meta<typeof MediaPlayer> = {
  title: 'Components/MediaPlayer',
  component: MediaPlayer,
};

type Story = StoryObj<typeof MediaPlayer>;

const Primary: Story = {
  render: args => (
    <div className="tw-content">
      <div className="p-4 rounded border">
        <MediaPlayer
          url={args.url}
          width={args.width}
          height={args.height}
          thumbnail={args.thumbnail}
        />
      </div>
    </div>
  ),
};

const Embedded: Story = {
  ...Primary,
  args: { width: '700px', height: '350px', url: 'https://www.youtube.com/watch?v=a3ICNMQW7Ok' },
};

const LocalFile: Story = {
  ...Primary,
  args: {
    width: '700px',
    height: '350px',
    url: '/short-video.mp4',
    thumbnail: { color: 'red', fileName: 'Short video' },
  },
};

const LocalFileWithThumbnail: Story = {
  ...Primary,
  args: {
    width: '700px',
    height: '350px',
    url: '/short-video.mp4',
    thumbnail: { url: '/short-video-thumbnail.jpg' },
  },
};

const InvalidMedia: Story = {
  ...Primary,
  args: { width: '700px', height: '350px', url: '/sample.pdf' },
};

export { Embedded, LocalFile, LocalFileWithThumbnail, InvalidMedia };

export default meta;
