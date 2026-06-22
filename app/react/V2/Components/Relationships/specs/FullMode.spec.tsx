/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import { apiEntity } from '#app/stories/fixtures/referencesFixtures.js';
import { templatesAtom } from '#V2/atoms/index.js';
import { projectRelationshipMarkers } from '#V2/formatters/index.js';
import {
  groupDocumentRelationships,
  groupRelationships,
  splitMarkersByAnchor,
} from '../groupRelationships.js';
import { FullMode } from '../Components/FullMode.js';

describe('FullMode', () => {
  const store = createStore();
  store.set(templatesAtom, [{ _id: 'template3', color: '#2b8a3e', name: 'Person' }]);

  const markers = projectRelationshipMarkers(apiEntity);
  const documentClusters = groupDocumentRelationships(
    groupRelationships(splitMarkersByAnchor(markers).anchored),
    22
  );

  it('marks the active standalone relationship', () => {
    const activeMarker = markers.find(marker => marker._id === 'ref-partner-33');
    const soloClusters = activeMarker
      ? [{ type: 'single' as const, page: 1, references: [activeMarker], startPage: 1, endPage: 1 }]
      : documentClusters;

    render(
      <Provider store={store}>
        <div className="relative h-200">
          <FullMode
            document={apiEntity.documents![0]}
            markerLayerHeight={800}
            documentClusters={soloClusters}
            activeRelationshipId="ref-partner-33"
          />
        </div>
      </Provider>
    );

    const marker = document.querySelector('[data-marker-id="ref-partner-33"]');
    expect(marker).not.toBeNull();
    expect(marker?.querySelector('[data-testid="rail-marker-dot"]')).toHaveStyle({ width: '14px' });
  });

  it('exposes stack order on document clusters', () => {
    render(
      <Provider store={store}>
        <div className="relative h-200">
          <FullMode
            document={apiEntity.documents![0]}
            markerLayerHeight={800}
            documentClusters={documentClusters}
          />
        </div>
      </Provider>
    );

    const clusters = document.querySelectorAll('[data-testid="rail-marker-cluster"]');
    expect(clusters.length).toBeGreaterThan(1);
    clusters.forEach(cluster => {
      expect(cluster.getAttribute('data-stack-order')).not.toBeNull();
      expect(Number.parseInt(cluster.getAttribute('data-stack-order') ?? '', 10)).toBeGreaterThan(
        0
      );
    });
  });
});
