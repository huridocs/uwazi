/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { TabButtons } from '../TabButtons.js';

let mockIsMobile = false;

jest.mock('#app/V2/CustomHooks/useIsMobile.js', () => ({
  useIsMobile: () => mockIsMobile,
}));

const buttons = [
  { id: 'document', name: 'Document', label: 'Document' },
  { id: 'metadata', name: 'Metadata', label: 'Metadata' },
];

const mockWidths = (available: number, natural: number) => {
  jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function rect(
    this: HTMLElement
  ) {
    const width = this.dataset.strip === 'probe' ? natural : available;
    return {
      width,
      height: 10,
      top: 0,
      left: 0,
      bottom: 10,
      right: width,
      x: 0,
      y: 0,
      toJSON() {
        return {};
      },
    };
  });
};

describe('TabButtons', () => {
  beforeEach(() => {
    mockIsMobile = false;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows tab labels when the strip fits', () => {
    mockWidths(400, 120);
    render(
      <TabButtons groupId="entity-main" buttons={buttons} tabListAriaLabel="Entity primary" />
    );
    const tab = screen.getByRole('tab', { name: 'Document' });
    const probe = document.querySelector('[data-strip="probe"]');
    if (!probe) {
      throw new Error('missing strip probe');
    }
    expect(tab.compareDocumentPosition(probe)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(screen.queryByRole('button', { name: 'Entity primary' })).not.toBeInTheDocument();
  });

  it('folds on a mobile viewport even when the labels fit', () => {
    mockIsMobile = true;
    mockWidths(400, 120);
    render(
      <TabButtons groupId="entity-main" buttons={buttons} tabListAriaLabel="Entity primary" />
    );
    expect(screen.queryByRole('tab', { name: 'Document' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entity primary' })).toHaveTextContent('Document');
  });

  it('folds into a labeled select when the strip does not fit', () => {
    mockWidths(80, 400);
    render(
      <TabButtons groupId="entity-main" buttons={buttons} tabListAriaLabel="Entity primary" />
    );
    expect(screen.queryByRole('tab', { name: 'Document' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entity primary' })).toHaveTextContent('Document');
    expect(document.getElementById('entity-main-tab-document')).toHaveTextContent('Document');
    expect(document.getElementById('entity-main-tab-metadata')).toHaveTextContent('Metadata');
  });

  it('keeps tab counts in the folded menu', () => {
    mockWidths(80, 400);
    render(
      <TabButtons
        groupId="entity-side"
        buttons={[
          { id: 'relationships', name: 'Relationships', label: <>Relationships 8</> },
          { id: 'files', name: 'Files', label: <>Files 6</> },
        ]}
        tabListAriaLabel="Side panel tabs"
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Side panel tabs' }));
    expect(screen.getByRole('option', { name: 'Relationships 8' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Files 6' })).toBeInTheDocument();
  });
});
