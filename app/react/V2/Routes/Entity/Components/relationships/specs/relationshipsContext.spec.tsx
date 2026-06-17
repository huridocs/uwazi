/**
 * @jest-environment jsdom
 */
import React, { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import type { TextSelection } from '@huridocs/react-text-selection-handler';
import type { Entity } from '#V2/api/entities/types.js';
import { RelationshipView } from '#V2/formatters/relationships/types.js';
import {
  EntityScopedProvider,
  useRelationships,
  useRelationshipsActions,
  useRelationshipsPanelFilters,
} from '#V2/Routes/Entity/Components/context/index.js';

const selection: TextSelection = {
  text: 'Selected text',
  selectionRectangles: [{ top: 0, left: 0, width: 10, height: 10, regionId: '1' }],
};

const relationship: RelationshipView = {
  _id: 'rel-1',
  hub: 'h1',
  type: 'rel-type',
  from: {
    type: 'entity',
    entity: 'entity1',
    entityTitle: 'Source',
    entityTemplateId: 'template1',
  },
  to: {
    type: 'entity',
    entity: 'target1',
    entityTitle: 'Target',
    entityTemplateId: 'template2',
  },
  relationTypeOnSelf: false,
};

const entity = {
  _id: 'ent1',
  sharedId: 'shared1',
  language: 'en',
  title: 'Source',
  template: 'template1',
  creationDate: 1,
  user: 'user1',
  relations: [],
} as Entity;

const wrapper = ({ children }: { children: ReactNode }) => (
  <EntityScopedProvider entity={entity}>{children}</EntityScopedProvider>
);

const useRelationshipsTestState = () => ({
  state: useRelationships(),
  actions: useRelationshipsActions(),
});

describe('relationships state context', () => {
  it('stores relationships', () => {
    const { result } = renderHook(() => useRelationshipsTestState(), { wrapper });

    act(() => {
      result.current.actions.setRelationships([relationship]);
    });

    expect(result.current.state.relationships).toEqual([relationship]);
  });

  it('opens the create-reference flow', () => {
    const { result } = renderHook(() => useRelationshipsTestState(), { wrapper });

    act(() => {
      result.current.actions.setCreateReferenceSelection(selection, 'text');
    });

    expect(result.current.state).toMatchObject({
      createReferenceSelection: selection,
      createReferenceMode: 'text',
    });
  });

  it('removes a relationship from state', () => {
    const { result } = renderHook(() => useRelationshipsTestState(), { wrapper });

    act(() => {
      result.current.actions.setRelationships([relationship]);
      result.current.actions.deleteRelationship('rel-1');
    });

    expect(result.current.state.relationships).toEqual([]);
  });
});

describe('relationships panel filters', () => {
  it('counts active filters', () => {
    const { result } = renderHook(() => useRelationshipsPanelFilters(), { wrapper });

    act(() => {
      result.current.setSearch('witness');
      result.current.setSort('title');
      result.current.setRelTypeFilters({ 'type-a': true });
      result.current.setActiveClusterRefIds(['ref-1']);
    });

    expect(result.current.activeFilterCount).toBe(4);
  });

  it('resets filters via clearFilters', () => {
    const { result } = renderHook(() => useRelationshipsPanelFilters(), { wrapper });

    act(() => {
      result.current.setSearch('witness');
      result.current.setSort('title');
      result.current.clearFilters();
    });

    expect(result.current).toMatchObject({
      search: '',
      sort: 'none',
      activeFilterCount: 0,
    });
  });
});
