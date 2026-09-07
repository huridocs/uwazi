import React, { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { Provider, createStore } from 'jotai';
import {
  localeAtom,
  settingsAtom,
  templatesAtom,
  translationsAtom,
  userAtom,
} from '#V2/atoms/index.js';
import { templates, translations } from '../fixtures/referencesFixtures.js';
import { TextFacet } from '#V2/Routes/Library/Components/TextFacet.js';
import { NumericFacet } from '#V2/Routes/Library/Components/NumericFacet.js';
import { DateFacet } from '#V2/Routes/Library/Components/DateFacet.js';
import { KeywordFacet } from '#V2/Routes/Library/Components/KeywordFacet.js';
import { RelationshipFacet } from '#V2/Routes/Library/Components/RelationshipFacet.js';
import { NestedFacet } from '#V2/Routes/Library/Components/NestedFacet.js';
import { FacetCard, FacetRow, type FacetMode } from '#V2/Routes/Library/Components/FacetCard.js';
import type { FacetLookupResult } from '#V2/Routes/Library/lookupAggregation.js';
import type { LibraryFacetBucket } from '#shared/types/librarySearch.js';
import type { PropertySchema } from '#shared/types/commonTypes.js';
import { GlobeAltIcon, LockClosedIcon } from '@heroicons/react/24/outline';

const StoreShell = ({ children }: { children: React.ReactNode }) => {
  const store = createStore();
  store.set(localeAtom, 'en');
  store.set(templatesAtom, templates);
  store.set(translationsAtom, translations);
  store.set(settingsAtom, {});
  store.set(userAtom, { _id: 'admin1', role: 'admin', email: 'admin@uwazi.io', username: 'admin' });
  return <Provider store={store}>{children}</Provider>;
};

type LookupLog = {
  endpoint: string;
  searchTerm: string;
  returned: number;
  total: number;
};

const FilterStoryFrame = ({
  children,
  state,
}: {
  children: React.ReactNode;
  state: Record<string, unknown>;
}) => (
  <div className="tw-content flex flex-wrap items-start gap-6 p-4">
    <div className="w-80 shrink-0">{children}</div>
    <pre className="min-w-64 flex-1 overflow-auto rounded-lg border border-border bg-warm p-3 text-xs text-ink">
      {JSON.stringify(state, null, 2)}
    </pre>
  </div>
);

const toggleValue = (current: string[], value: string) =>
  current.includes(value) ? current.filter(item => item !== value) : [...current, value];

const categoryBuckets: LibraryFacetBucket[] = [
  {
    id: 'cat-a',
    label: 'Categoría A',
    count: 39,
    values: [
      { id: 'cat-1', label: 'Categoría 1', count: 8 },
      { id: 'cat-2', label: 'Categoría 2', count: 7 },
      { id: 'cat-3', label: 'Categoría 3', count: 9 },
      { id: 'cat-4', label: 'Categoría 4', count: 15 },
    ],
  },
  {
    id: 'cat-b',
    label: 'Categoría B',
    count: 6,
    values: [
      { id: 'cat-5', label: 'Categoría 5', count: 4 },
      { id: 'cat-6', label: 'Categoría 6', count: 2 },
    ],
  },
  { id: 'any', label: 'Any', count: 45 },
];

const descriptorBuckets: LibraryFacetBucket[] = [
  { id: 'd1', label: 'Amenazas y hostigamientos', count: 83 },
  { id: 'd2', label: 'Ejecución extrajudicial', count: 57 },
  { id: 'd3', label: 'Tortura y tratos crueles', count: 57 },
  { id: 'd4', label: 'Desaparición forzada', count: 56 },
  { id: 'd5', label: 'Privación de libertad', count: 50 },
  { id: 'd6', label: 'Defensores/as de derechos humanos', count: 48 },
  { id: 'd7', label: 'Violencia sexual', count: 41 },
  { id: 'd8', label: 'Desplazamiento forzado', count: 38 },
  { id: 'd9', label: 'Detención arbitraria', count: 33 },
  { id: 'd10', label: 'Libertad de expresión', count: 29 },
  { id: 'd11', label: 'Acceso a la justicia', count: 22 },
  { id: 'd12', label: 'Niñez', count: 18 },
];

const countryBuckets: LibraryFacetBucket[] = [
  { id: 'ES', label: 'Spain', count: 12 },
  { id: 'FR', label: 'France', count: 9 },
  { id: 'AR', label: 'Argentina', count: 7 },
  { id: 'MX', label: 'Mexico', count: 6 },
  { id: 'CO', label: 'Colombia', count: 4 },
];

const RELATED_ENTITIES: LibraryFacetBucket[] = Array.from({ length: 80 }, (_, index) => ({
  id: `entity-${index + 1}`,
  label: `Related entity ${index + 1}`,
  count: Math.max(1, 40 - Math.floor(index / 2)),
}));

const fakeRelationshipLookup = async (
  searchTerm: string,
  onLog: (log: LookupLog) => void
): Promise<FacetLookupResult> => {
  await new Promise(resolve => {
    window.setTimeout(resolve, 180);
  });
  const query = searchTerm.trim().toLowerCase();
  const matched = query
    ? RELATED_ENTITIES.filter(item => item.label?.toLowerCase().includes(query))
    : RELATED_ENTITIES;
  const buckets = matched.slice(0, 12);
  onLog({
    endpoint: 'GET /api/search/lookupaggregation',
    searchTerm,
    returned: buckets.length,
    total: matched.length,
  });
  return { buckets, total: matched.length };
};

const nestedProperty: PropertySchema = {
  _id: 'p-causa',
  name: 'causa',
  label: 'Causa',
  type: 'nested',
  nestedProperties: ['numero', 'fecha'],
};

const nestedGroups: LibraryFacetBucket[] = [
  {
    id: 'numero',
    label: 'numero',
    count: 12,
    values: [
      { id: '1.1', label: '1.1', count: 4 },
      { id: '1.2', label: '1.2', count: 5 },
      { id: '2.1', label: '2.1', count: 3 },
    ],
  },
  {
    id: 'fecha',
    label: 'fecha',
    count: 8,
    values: [
      { id: '2020', label: '2020', count: 5 },
      { id: '2021', label: '2021', count: 3 },
    ],
  },
];

const meta: Meta = {
  title: 'Library/Filters',
  decorators: [
    Story => (
      <StoreShell>
        <Story />
      </StoreShell>
    ),
  ],
};

type Story = StoryObj;

const TextPreview = () => {
  const [value, setValue] = useState('forced disappearance');
  return (
    <FilterStoryFrame state={{ type: 'text', value, values: value ? [value] : [] }}>
      <TextFacet title="Title" name="title" value={value} onChange={setValue} />
    </FilterStoryFrame>
  );
};

const NumericPreview = () => {
  const [range, setRange] = useState({ from: '18', to: '65' });
  return (
    <FilterStoryFrame state={{ type: 'numeric', ...range, values: [range.from, range.to] }}>
      <NumericFacet title="Age" name="age" from={range.from} to={range.to} onChange={setRange} />
    </FilterStoryFrame>
  );
};

const DatePreview = () => {
  const [range, setRange] = useState<{ from?: number; to?: number }>({});
  return (
    <FilterStoryFrame
      state={{
        type: 'date',
        from: range.from,
        to: range.to,
        values: [range.from, range.to].filter(value => value !== undefined),
      }}
    >
      <DateFacet title="Date" name="date" from={range.from} to={range.to} onChange={setRange} />
    </FilterStoryFrame>
  );
};

const SelectPreview = () => {
  const [selected, setSelected] = useState<string[]>(['ES']);
  return (
    <FilterStoryFrame state={{ type: 'select', selected, andOr: 'or (select has no AND/OR)' }}>
      <KeywordFacet
        title="Country"
        buckets={countryBuckets}
        selected={selected}
        onToggle={id => setSelected(current => toggleValue(current, id))}
      />
    </FilterStoryFrame>
  );
};

const MultiselectPreview = () => {
  const [selected, setSelected] = useState<string[]>(['d1', 'd4']);
  const [mode, setMode] = useState<FacetMode>('or');
  return (
    <FilterStoryFrame state={{ type: 'multiselect', selected, andOr: mode }}>
      <KeywordFacet
        title="Descriptores"
        buckets={descriptorBuckets}
        selected={selected}
        onToggle={id => setSelected(current => toggleValue(current, id))}
        mode={mode}
        onModeChange={setMode}
      />
    </FilterStoryFrame>
  );
};

const ThesaurusPreview = () => {
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <FilterStoryFrame state={{ type: 'select (thesaurus groups)', selected, andOr: 'or' }}>
      <KeywordFacet
        title="Categoría"
        buckets={categoryBuckets}
        selected={selected}
        onToggle={id => setSelected(current => toggleValue(current, id))}
        defaultExpanded
      />
    </FilterStoryFrame>
  );
};

const NestedPreview = () => {
  const [selectedByGroup, setSelectedByGroup] = useState<Record<string, string[]>>({
    numero: ['1.1'],
  });
  return (
    <FilterStoryFrame state={{ type: 'nested', selectedByGroup }}>
      <NestedFacet
        title="Causa"
        property={nestedProperty}
        groups={nestedGroups}
        selectedByGroup={selectedByGroup}
        onChangeGroup={(groupId, values) =>
          setSelectedByGroup(current => ({ ...current, [groupId]: values }))
        }
        locale="en"
        defaultExpanded
      />
    </FilterStoryFrame>
  );
};

const RelationshipPreview = () => {
  const [selected, setSelected] = useState<string[]>(['entity-2']);
  const [mode, setMode] = useState<FacetMode>('and');
  const [logs, setLogs] = useState<LookupLog[]>([]);
  const lookup = useMemo(
    () => async (searchTerm: string) =>
      fakeRelationshipLookup(searchTerm, log => setLogs(current => [log, ...current].slice(0, 8))),
    []
  );
  return (
    <FilterStoryFrame
      state={{
        type: 'relationship',
        selected,
        andOr: mode,
        lookupEndpoint: 'GET /api/search/lookupaggregation',
        lastLookups: logs,
      }}
    >
      <RelationshipFacet
        title="Related entities"
        buckets={RELATED_ENTITIES.slice(0, 8)}
        selected={selected}
        onToggle={id => setSelected(current => toggleValue(current, id))}
        lookup={lookup}
        mode={mode}
        onModeChange={setMode}
      />
    </FilterStoryFrame>
  );
};

const StatusPreview = () => {
  const [status, setStatus] = useState<string[]>(['published']);
  return (
    <FilterStoryFrame state={{ type: 'status', selected: status }}>
      <FacetCard title="Status">
        <FacetRow
          checked={status.includes('restricted')}
          onToggle={() => setStatus(current => toggleValue(current, 'restricted'))}
          label="Restricted"
          icon={<LockClosedIcon className="h-3.5 w-3.5 shrink-0 text-ink-tertiary" />}
          count={3}
          bold
        />
        <FacetRow
          checked={status.includes('published')}
          onToggle={() => setStatus(current => toggleValue(current, 'published'))}
          label="Published"
          icon={<GlobeAltIcon className="h-3.5 w-3.5 shrink-0 text-ink-tertiary" />}
          count={12}
          bold
        />
      </FacetCard>
    </FilterStoryFrame>
  );
};

const TypePreview = () => {
  const [selected, setSelected] = useState<string[]>(['template1']);
  return (
    <FilterStoryFrame state={{ type: 'type (templates)', selected }}>
      <FacetCard title="Type">
        <FacetRow
          checked={selected.includes('template1')}
          onToggle={() => setSelected(current => toggleValue(current, 'template1'))}
          label="Documents"
          count={8}
          bold
        />
        <FacetRow
          checked={selected.includes('template2')}
          onToggle={() => setSelected(current => toggleValue(current, 'template2'))}
          label="People"
          count={7}
          bold
        />
      </FacetCard>
    </FilterStoryFrame>
  );
};

const Text: Story = { render: () => <TextPreview /> };
const Numeric: Story = { render: () => <NumericPreview /> };
const DateRange: Story = { name: 'Date', render: () => <DatePreview /> };
const Select: Story = { render: () => <SelectPreview /> };
const Multiselect: Story = { render: () => <MultiselectPreview /> };
const Thesaurus: Story = { render: () => <ThesaurusPreview /> };
const Nested: Story = { render: () => <NestedPreview /> };
const Relationship: Story = { render: () => <RelationshipPreview /> };
const Status: Story = { render: () => <StatusPreview /> };
const Type: Story = { render: () => <TypePreview /> };

export default meta;
export {
  Text,
  Numeric,
  DateRange,
  Select,
  Multiselect,
  Thesaurus,
  Nested,
  Relationship,
  Status,
  Type,
};
