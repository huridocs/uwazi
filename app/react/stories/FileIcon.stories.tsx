import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { FileIcon } from 'V2/Components/UI';

const meta: Meta<typeof FileIcon> = {
  title: 'Components/FileIcon',
  component: FileIcon,
};

type Story = StoryObj<typeof FileIcon>;

const Primary: Story = {
  render: () => (
    <div className="tw-content">
      <div className="flex gap-6">
        <FileIcon
          mimetype="image/jpeg"
          filename="short-video-thumbnail.jpg"
          altText="short-video-thumbnail.jpg"
          className="w-20"
        />
        <FileIcon
          mimetype="application/zip"
          filename="anotherfile.zip"
          altText="a zip file"
          className="w-20"
        />
        <FileIcon
          mimetype="application/pdf"
          filename="somefile.pdf"
          altText="some file"
          className="w-20"
        />
      </div>
    </div>
  ),
};

const Basic: Story = {
  ...Primary,
};

export { Basic };

export default meta;
