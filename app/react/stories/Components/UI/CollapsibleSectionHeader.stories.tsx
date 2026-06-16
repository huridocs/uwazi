import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { ColorDot } from '#V2/Components/UI/ColorDot.js';
import { CollapsibleSectionHeader } from '#V2/Components/UI/CollapsibleSectionHeader.js';
import { FacetSection } from '#V2/Components/UI/FacetSection.js';
import { RelationshipsTreeBranch } from '#V2/Routes/Entity/Components/RelationshipsPanel/RelationshipsTreeBranch.js';

const templateColors: Record<string, string> = {
  person: '#f59e0b',
  country: '#22c55 ',
  document: '#3b82f6',
};

const FacetPreview = () => {
  const [selected, setSelected] = useState<Record<string, boolean>>({ related: true });
  const toggle = (id: string) => setSelected(current => ({ ...current, [id]: !current[id] }));

  return (
    <div className="max-w-[340px] overflow-hidden rounded-md border border-border-soft bg-paper shadow-lg">
      <div className="border-b border-border-soft px-4 py-2.5 text-xs font-semibold text-ink-secondary">
        Filters
      </div>
      <FacetSection
        title="Relation type"
        total={43}
        entries={[['related', 43]]}
        selected={selected}
        onToggle={toggle}
        label={() => 'related to'}
      />
      <FacetSection
        title="Target entity type"
        total={43}
        entries={[
          ['person', 33],
          ['country', 10],
        ]}
        selected={selected}
        onToggle={toggle}
        label={id => (id === 'person' ? 'Person' : 'Country')}
        renderMarker={id => <ColorDot color={templateColors[id]} size="md" />}
      />
    </div>
  );
};

const GroupedPreview = () => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="max-w-md overflow-hidden rounded-md border border-border/60 bg-paper">
      <CollapsibleSectionHeader
        variant="group"
        title="Person"
        color={templateColors.person}
        count={12}
        expanded={expanded}
        onToggle={() => setExpanded(current => !current)}
      />
      {expanded && (
        <div className="border-t border-border/40 px-3 py-2 text-xs text-ink-secondary">
          <p className="border-b border-border/50 py-2">Mexico → related to → This document</p>
          <p className="border-b border-border/50 py-2">Ana García → related to → This document</p>
          <p className="py-2">Luis Torres → related to → This document</p>
        </div>
      )}
    </div>
  );
};

const TreePreview = () => (
  <div className="max-w-md rounded-md bg-paper p-2">
    <RelationshipsTreeBranch
      connectHeader={false}
      title="This document"
      color={templateColors.document}
      count={4}
      markerIds={[]}
    >
      <RelationshipsTreeBranch
        title="Person"
        color={templateColors.person}
        count={3}
        markerIds={[]}
      >
        <p className="py-1.5 pl-2 text-xs text-ink-secondary">Mexico</p>
        <p className="py-1.5 pl-2 text-xs text-ink-secondary">Ana García</p>
      </RelationshipsTreeBranch>
      <p className="py-1.5 pl-2 text-xs text-ink-secondary">Country · Mexico</p>
    </RelationshipsTreeBranch>
  </div>
);

const meta: Meta = {
  title: 'Components/UI/CollapsibleSectionHeader',
};

type Story = StoryObj;

const Facet: Story = {
  render: () => (
    <div className="tw-content p-4">
      <FacetPreview />
    </div>
  ),
};

const Grouped: Story = {
  render: () => (
    <div className="tw-content p-4">
      <GroupedPreview />
    </div>
  ),
};

const Tree: Story = {
  render: () => (
    <div className="tw-content p-4">
      <TreePreview />
    </div>
  ),
};

export default meta;
export { Facet, Grouped, Tree };
