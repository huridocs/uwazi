import React from 'react';
import { RelationshipsStoryShell } from './RelationshipsStoryShell.js';

type RelationshipsPanelStoryProps = {
  locale: 'en' | 'es';
};

const RelationshipsPanelStory = ({ locale }: RelationshipsPanelStoryProps) => (
  <RelationshipsStoryShell locale={locale} />
);

export { RelationshipsPanelStory };
