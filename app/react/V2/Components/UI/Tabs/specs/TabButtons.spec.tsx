/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { TabButtons } from '../TabButtons.js';

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
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows tab labels when the strip fits', () => {
    mockWidths(400, 120);
    render(
      <TabButtons groupId="entity-main" buttons={buttons} tabListAriaLabel="Entity primary" />
    );
    expect(screen.getByRole('tab', { name: 'Document' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Entity primary' })).not.toBeInTheDocument();
  });

  it('folds into a labeled select when the strip does not fit', () => {
    mockWidths(80, 400);
    render(
      <TabButtons groupId="entity-main" buttons={buttons} tabListAriaLabel="Entity primary" />
    );
    expect(screen.queryByRole('tab', { name: 'Document' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entity primary' })).toHaveTextContent('Document');
  });
});
