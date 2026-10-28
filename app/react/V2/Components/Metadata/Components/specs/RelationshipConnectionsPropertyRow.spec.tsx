/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { RelationshipConnectionsTable } from '../RelationshipConnectionsTable.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  I18NLinkV2: ({ children, ...props }: { children: React.ReactNode; to: string }) => (
    <a href={props.to}>{children}</a>
  ),
}));

jest.mock('#V2/Components/UI/TemplatePill.js', () => ({
  TemplatePill: ({ label }: { label: string }) => <span>{label}</span>,
}));

const cellBox = (element: HTMLElement) => {
  const height = element.closest('td') ? 180 : 24;
  return {
    height,
    width: 100,
    top: 0,
    left: 0,
    bottom: height,
    right: 100,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  };
};

const stubWideBulkyCard = () => {
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get(this: HTMLElement) {
      return this.hasAttribute('data-connections-root') ? 791 : 100;
    },
  });
  Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
    configurable: true,
    get: () => 791,
  });
  HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRect(this: HTMLElement) {
    return cellBox(this);
  };
};

describe('RelationshipConnectionsTable property row', () => {
  it('lays oversized values out as one row of property cards', () => {
    const rect = HTMLElement.prototype.getBoundingClientRect;
    stubWideBulkyCard();
    try {
      render(
        <RelationshipConnectionsTable
          rows={[{ id: 'e1', label: 'Alpha', templateId: 't1' }]}
          columns={[
            {
              label: 'Markdown',
              inheritedType: 'markdown',
              cellsByEntityId: { e1: 'A long note' },
            },
            { label: 'Geolocation', inheritedType: 'geolocation', cellsByEntityId: { e1: 'Map' } },
          ]}
        />
      );
      const row = screen.getByTestId('connection-property-row');
      expect(row).toHaveStyle({
        gridTemplateColumns: 'minmax(0, max-content) minmax(0, 3fr) minmax(0, 1fr)',
      });
      expect(row.firstElementChild).toHaveTextContent('Alpha');
      expect(row.children[1]).toHaveTextContent('A long note');
      expect(screen.queryByTestId('connection-card-stack')).not.toBeInTheDocument();
    } finally {
      HTMLElement.prototype.getBoundingClientRect = rect;
    }
  });
});
