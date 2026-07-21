import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';
import {
  RelationshipsDocumentStory,
  type RelationshipsDocumentStoryProps,
} from './relationshipsDocumentViews.js';
import { RelationshipsStoryShell } from './relationshipsStoryShell.js';

const meta: Meta<typeof RelationshipsDocumentStory> = {
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
};

type Story = StoryObj<RelationshipsDocumentStoryProps>;

const Primary: Story = {
  render: args => <RelationshipsDocumentStory {...args} />,
};

const Basic: Story = {
  ...Primary,
  args: {
    fileUrl: undefined,
  },
};

const Panel: Story = {
  render: () => <RelationshipsStoryShell locale="en" />,
  parameters: { layout: 'fullscreen' },
};

const WithPanel: Story = {
  render: () => <RelationshipsStoryShell locale="en" layout="split" />,
  parameters: { layout: 'fullscreen' },
};

export default meta;
export { Basic, Panel, WithPanel };
