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
      <MediaPlayer url={args.url} width={args.width} height={args.height} />
    </div>
  ),
};

const Embedded: Story = {
  ...Primary,
  args: { width: '700px', height: '350px', url: 'https://www.youtube.com/watch?v=a3ICNMQW7Ok' },
};

const LocalFile: Story = {
  ...Primary,
  args: { width: '700px', height: '350px', url: '/short-video.mp4' },
};

const InvalidMedia: Story = {
  ...Primary,
  args: { width: '700px', height: '350px', url: '/sample.pdf' },
};

export { Embedded, LocalFile, InvalidMedia };

export default meta;
