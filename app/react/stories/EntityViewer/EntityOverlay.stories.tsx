import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { RelationshipsPanel } from '#V2/Routes/Entity/Components/relationships/index.js';
import {
  overlayTargetEntity,
  overlayTargetSharedId,
  overlayTemplates,
} from '../fixtures/entityOverlayFixtures.js';
import { OpenEntityOverlayOnMount, SeedOverlayEntityCache } from './entityOverlayStoryHelpers.js';
import { RelationshipsStoryShell } from './relationshipsStoryShell.js';

const meta: Meta = {
  title: 'EntityViewer/EntityOverlay',
};

type Story = StoryObj;

const SplitViewOpen: Story = {
  render: () => (
    <RelationshipsStoryShell locale="en" layout="split" storyTemplates={overlayTemplates}>
      <SeedOverlayEntityCache entity={overlayTargetEntity} />
      <OpenEntityOverlayOnMount targetSharedId={overlayTargetSharedId} />
      <RelationshipsPanel />
    </RelationshipsStoryShell>
  ),
};

const PanelOpen: Story = {
  render: () => (
    <RelationshipsStoryShell locale="en" layout="panel" storyTemplates={overlayTemplates}>
      <SeedOverlayEntityCache entity={overlayTargetEntity} />
      <OpenEntityOverlayOnMount targetSharedId={overlayTargetSharedId} />
      <RelationshipsPanel />
    </RelationshipsStoryShell>
  ),
};

export default meta;
export { SplitViewOpen, PanelOpen };
