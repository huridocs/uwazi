/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { EntityTabFooter } from '../EntityTabFooter.js';

const horizontalPadding = (element: HTMLElement) =>
  element.className.split(/\s+/).filter(token => token.startsWith('px-'));

describe('EntityTabFooter', () => {
  it('uses px-4 on the main footer', () => {
    render(<EntityTabFooter>Notes</EntityTabFooter>);
    expect(horizontalPadding(screen.getByTestId('entity-tab-footer'))).toEqual(['px-4']);
  });

  it('uses px-3 on the side footer', () => {
    render(<EntityTabFooter inset="side">Notes</EntityTabFooter>);
    expect(horizontalPadding(screen.getByTestId('entity-tab-footer'))).toEqual(['px-3']);
  });

  it('uses the padding override as the only horizontal padding', () => {
    render(
      <EntityTabFooter inset="main" padding="px-3">
        Notes
      </EntityTabFooter>
    );
    expect(horizontalPadding(screen.getByTestId('entity-tab-footer'))).toEqual(['px-3']);
  });

  it('places the ref on the footer', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<EntityTabFooter ref={ref}>Notes</EntityTabFooter>);
    expect(ref.current).toBe(screen.getByTestId('entity-tab-footer'));
  });
});
