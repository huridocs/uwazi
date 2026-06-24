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

  it('connects to the first point when the subtree reaches the top edge', () => {
    const layout = computeClusterSubtreeLayout({
      position: 0,
      markerLayerHeight: 720,
      outerSize: 28,
      rowCount,
    });

    expect(layout.topOffset).toBe(0);
    expect(layout.stemY).toBe(RAIL_MARKER_SIZE / 2);
  });

  it('connects to the last point when the subtree reaches the bottom edge', () => {
    const layout = computeClusterSubtreeLayout({
      position: 706,
      markerLayerHeight: 720,
      outerSize: 28,
      rowCount,
    });

    expect(layout.topOffset).toBe(720 - height - 706);
    expect(layout.stemY).toBe(height - RAIL_MARKER_SIZE / 2);
  });

  it('shows up to eighteen points and sends the full cluster from the overflow button', () => {
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
    fireEvent.click(screen.getByRole('button', { name: /Show more/ }));
    expect(onMoreClick).toHaveBeenCalledWith(references);
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
    expect(screen.getByText('x3')).toBeVisible();
  });
});
