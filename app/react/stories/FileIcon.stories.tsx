import React from 'react';
import preview from '#storybook/preview';
import { storyExtend } from '#app/stories/storyExtend.js';
import { FileIcon } from '#V2/Components/UI/index.js';

const meta = preview.meta({
  title: 'Components/FileIcon',
  component: FileIcon,
});

const Primary = meta.story({
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
});

const Basic = storyExtend(Primary, {});

export { Basic };
