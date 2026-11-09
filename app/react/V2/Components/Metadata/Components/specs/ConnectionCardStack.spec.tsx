/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ConnectionCardStack } from '../ConnectionCardStack.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('../EntityOverlayPill', () => ({
  EntityOverlayPill: ({ label }: { label: string }) => <span>{label}</span>,
}));

describe('ConnectionCardStack', () => {
  it('clips an inherited map inside the value cell', () => {
    render(
      <ConnectionCardStack
        rows={[{ id: 'e1', label: 'Entity' }]}
        columns={[
          {
            label: 'Place',
            inheritedType: 'geolocation',
            cellsByEntityId: { e1: <div className="map-container">map</div> },
          },
        ]}
        translationContext="template"
        emptyLabel="None"
      />
    );

    expect(screen.getByText('map').parentElement).toHaveClass('[&_.map-container]:z-0');
  });
});
