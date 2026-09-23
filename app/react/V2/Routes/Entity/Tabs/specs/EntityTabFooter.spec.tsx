/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { EntityTabFooter } from '../EntityTabFooter.js';

describe('EntityTabFooter', () => {
  it('wraps actions instead of clipping them to one line', () => {
    render(
      <EntityTabFooter>
        <button type="button">Cancel</button>
        <button type="button">Save</button>
      </EntityTabFooter>
    );
    const footer = screen.getByTestId('entity-tab-footer');
    expect(footer.className).toContain('min-h-12');
    expect(footer.className).toContain('flex-wrap');
    expect(footer.className).not.toContain('overflow-hidden');
    expect(footer.className).not.toContain('max-h-12');
  });
});
