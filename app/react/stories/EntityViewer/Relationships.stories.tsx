import React from 'react';
import preview from '#storybook/preview';
import { storyExtend } from '#app/stories/storyExtend.js';
import { fn } from 'storybook/test';
import { RelationshipsDocumentStory } from './relationshipsDocumentViews.js';
import { RelationshipsStoryShell } from './relationshipsStoryShell.js';

const meta = preview.meta({
  title: 'EntityViewer/RelationshipsDisplay',
  component: RelationshipsDocumentStory,
  args: {
    locale: 'en',
    activeRelationshipId: null,
    onPointClick: fn(),
    onClusterClick: fn(),
  },
  argTypes: {
    onPointClick: { action: 'point-clicked' },
    onClusterClick: { action: 'cluster-clicked' },
    activeRelationshipId: { control: 'text' },
  },
});

const Primary = meta.story({
  args: {
    locale: 'en',
    fileUrl: undefined,
    activeRelationshipId: null,
    onPointClick: fn(),
    onClusterClick: fn(),
  },
  render: args => (
    <RelationshipsDocumentStory
      locale={args.locale}
      fileUrl={args.fileUrl}
      activeRelationshipId={args.activeRelationshipId}
      onPointClick={args.onPointClick}
      onClusterClick={args.onClusterClick}
    />
  ),
});

const Basic = storyExtend(Primary, {
  args: {
    fileUrl: undefined,
  },
});

const Panel = meta.story({
  render: () => <RelationshipsStoryShell locale="en" />,
  parameters: { layout: 'fullscreen' },
});

const WithPanel = meta.story({
  render: () => <RelationshipsStoryShell locale="en" layout="split" />,
  parameters: { layout: 'fullscreen' },
});
export { Basic, Panel, WithPanel };
