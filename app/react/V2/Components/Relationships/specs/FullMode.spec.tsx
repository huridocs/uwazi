/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import { apiEntity } from '#app/stories/fixtures/referencesFixtures.js';
import { templatesAtom } from '#V2/atoms/index.js';
import { formatRelationships } from '#V2/formatters/index.js';
import { toMarker } from '../types.js';
import {
  groupDocumentRelationships,
  groupRelationships,
  splitMarkersByAnchor,
} from '../groupRelationships.js';
import { FullMode } from '../Components/FullMode.js';

describe('FullMode', () => {
  const store = createStore();
  store.set(templatesAtom, [{ _id: 'template3', color: '#2b8a3e', name: 'Person' }]);

  const markers = formatRelationships(apiEntity).map(view => toMarker(view, apiEntity.sharedId));
  const documentClusters = groupDocumentRelationships(
    groupRelationships(splitMarkersByAnchor(markers).anchored),
    22
  );

  it('marks the active standalone relationship', () => {
    render(
      <Provider store={store}>
        <div className="relative h-200">
          <FullMode
            document={apiEntity.documents![0]}
            markerLayerHeight={800}
            documentClusters={documentClusters}
            activeRelationshipId="ref-partner-33"
          />
        </div>
      </Provider>
    );

    const marker = document.querySelector('[data-marker-id="ref-partner-33"]');
    expect(marker).not.toBeNull();
    expect(marker?.querySelector('[data-testid="rail-marker-dot"]')).toHaveStyle({ width: '14px' });
  });
});
