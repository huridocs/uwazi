/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import { templatesAtom } from '#V2/atoms/index.js';
import { computeClusterSubtreeLayout, Cluster } from '../Components/Cluster.js';
import { RAIL_MARKER_SIZE, RAIL_MARKER_SPACING } from '../markerMetrics.js';
import type { RelationshipMarker } from '../types.js';

const marker = (index: number, valueIndex = index): RelationshipMarker => ({
  _id: `ref-${index}`,
  view: {
    _id: `ref-${index}`,
    hub: 'hub-1',
    type: 'rel-type',
    from: {
      type: 'textReference',
      entity: 'self',
      entityTitle: 'Self',
      entityTemplateId: 'template1',
      file: 'file1',
      text: `Reference ${valueIndex}`,
      selections: [{ page: 1, top: valueIndex * 10, left: 0, width: 10, height: 10 }],
    },
    to: {
      type: 'entity',
      entity: `target-${valueIndex}`,
      entityTitle: `Target ${valueIndex}`,
      entityTemplateId: 'template3',
    },
    relationTypeOnSelf: false,
  },
  target: {
    sharedId: `target-${valueIndex}`,
    title: `Target ${valueIndex}`,
    templateId: 'template3',
  },
  anchor: {
    type: 'textReference',
    entity: 'self',
    entityTitle: 'Self',
    entityTemplateId: 'template1',
    file: 'file1',
    text: `Reference ${valueIndex}`,
    selections: [{ page: 1, top: valueIndex * 10, left: 0, width: 10, height: 10 }],
  },
});

const EDGE_INSET = RAIL_MARKER_SPACING / 2;

const clampStem = (value: number, height: number) =>
  Math.min(Math.max(value, RAIL_MARKER_SIZE / 2), height - RAIL_MARKER_SIZE / 2);

describe('Cluster', () => {
  const rowCount = 11;
  const height = (rowCount - 1) * RAIL_MARKER_SPACING + RAIL_MARKER_SIZE;
  const store = createStore();
  store.set(templatesAtom, [{ _id: 'template3', color: '#2b8a3e', name: 'Person' }]);

  it('centers the subtree when there is enough space', () => {
    const layout = computeClusterSubtreeLayout({
      position: 300,
      markerLayerHeight: 800,
      outerSize: 24,
      rowCount,
    });

    expect(layout.topOffset).toBe(12 - height / 2);
    expect(layout.stemY).toBe(height / 2);
  });

  it('insets the subtree from the top edge and keeps the stem on the cluster center', () => {
    const position = 0;
    const outerSize = 28;
    const layout = computeClusterSubtreeLayout({
      position,
      markerLayerHeight: 720,
      outerSize,
      rowCount,
    });

    expect(layout.topOffset).toBe(EDGE_INSET - position);
    expect(layout.stemY).toBe(clampStem(position + outerSize / 2 - EDGE_INSET, height));
  });

  it('insets the subtree from the bottom edge and keeps the stem on the cluster center', () => {
    const position = 706;
    const outerSize = 28;
    const layout = computeClusterSubtreeLayout({
      position,
      markerLayerHeight: 720,
      outerSize,
      rowCount,
    });

    const top = 720 - height - EDGE_INSET;
    expect(layout.topOffset).toBe(top - position);
    expect(layout.stemY).toBe(clampStem(position + outerSize / 2 - top, height));
  });

  it('shows up to eighteen points and sends the overflow markers from the overflow button', () => {
    const references = Array.from({ length: 20 }, (_, index) => marker(index));
    const onMoreClick = jest.fn();

    render(
      <Provider store={store}>
        <Cluster
          position={100}
          markerLayerHeight={800}
          references={references}
          isOpen
          onPointClick={() => undefined}
          onMoreClick={onMoreClick}
        />
      </Provider>
    );

    expect(document.querySelectorAll('[data-marker-id]')).toHaveLength(18);
    fireEvent.click(screen.getByRole('button', { name: /Show remaining in panel/ }));
    expect(onMoreClick).toHaveBeenCalledWith(references.slice(18));
  });

  it('deduplicates repeated rail points and shows their represented count', () => {
    const references = [marker(1, 1), marker(2, 1), marker(3, 1)];

    render(
      <Provider store={store}>
        <Cluster
          position={100}
          markerLayerHeight={800}
          references={references}
          isOpen
          onPointClick={() => undefined}
          onMoreClick={() => undefined}
        />
      </Provider>
    );

    expect(document.querySelectorAll('[data-marker-id]')).toHaveLength(1);
    expect(screen.getByLabelText('3 matching references')).toBeVisible();
  });

  it('marks a grouped point active when any represented marker is active', () => {
    const references = [marker(1, 1), marker(2, 1)];

    render(
      <Provider store={store}>
        <Cluster
          position={100}
          markerLayerHeight={800}
          references={references}
          activePointId="ref-2"
          isOpen
          onPointClick={() => undefined}
          onMoreClick={() => undefined}
        />
      </Provider>
    );

    expect(screen.getByTestId('rail-marker-dot')).toHaveStyle({ opacity: '1' });
  });
});
