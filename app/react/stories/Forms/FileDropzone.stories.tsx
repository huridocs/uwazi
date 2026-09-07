import React from 'react';
import preview from '#storybook/preview';
import { storyExtend } from '#app/stories/storyExtend.js';
import { FileDropzone } from '#V2/Components/Forms/index.js';

const meta = preview.meta({
  title: 'Forms/FileDropzone',
  component: FileDropzone,
});

const Primary = meta.story({
  render: args => (
    <div className="tw-content">
      <FileDropzone className="w-1/2" onDrop={args.onDrop} onChange={args.onChange} />
    </div>
  ),
});

const Basic = storyExtend(Primary, {
  args: {
    onDrop: _files => {},
    onChange: _files => {},
  },
});
export { Basic };
