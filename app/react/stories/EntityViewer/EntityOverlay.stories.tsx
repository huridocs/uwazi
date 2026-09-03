import React from 'react';
import preview from '#storybook/preview';
import { RelationshipsPanel } from '#V2/Routes/Entity/Components/relationships/index.js';
import {
  overlayTargetEntity,
  overlayTargetSharedId,
  overlayTemplates,
} from '../fixtures/entityOverlayFixtures.js';
import { OpenEntityOverlayOnMount, SeedOverlayEntityCache } from './entityOverlayStoryHelpers.js';
import { RelationshipsStoryShell } from './relationshipsStoryShell.js';

const meta = preview.meta({
  title: 'EntityViewer/EntityOverlay',
});

const SplitViewOpen = meta.story({
  render: () => (
    <RelationshipsStoryShell locale="en" layout="split" storyTemplates={overlayTemplates}>
      <SeedOverlayEntityCache entity={overlayTargetEntity} />
      <OpenEntityOverlayOnMount targetSharedId={overlayTargetSharedId} />
      <RelationshipsPanel />
    </RelationshipsStoryShell>
  ),
});

const PanelOpen = meta.story({
  render: () => (
    <RelationshipsStoryShell locale="en" layout="panel" storyTemplates={overlayTemplates}>
      <SeedOverlayEntityCache entity={overlayTargetEntity} />
      <OpenEntityOverlayOnMount targetSharedId={overlayTargetSharedId} />
      <RelationshipsPanel />
    </RelationshipsStoryShell>
  ),
});

export { SplitViewOpen, PanelOpen };
