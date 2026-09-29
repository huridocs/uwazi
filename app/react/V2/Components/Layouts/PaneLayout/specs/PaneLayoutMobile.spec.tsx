/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { PaneLayoutMobile } from '../PaneLayoutMobile.js';

const panes = (request?: { index: number; id: number }) =>
  render(
    <PaneLayoutMobile requestedPane={request}>
      <div key="main">Main</div>
      <div key="side">Side</div>
    </PaneLayoutMobile>
  );

const trackStyle = (container: HTMLElement) =>
  container.querySelector('[data-testid="pane-track"]')?.getAttribute('style') ?? '';

describe('PaneLayoutMobile', () => {
  it('moves to the requested pane and still allows leaving it', () => {
    const view = panes({ index: 1, id: 1 });
    expect(trackStyle(view.container)).toContain('calc(-100%');

    const dots = view.container.querySelectorAll('.rounded-full');
    fireEvent.click(dots[0]);
    expect(trackStyle(view.container)).toContain('calc(-0%');

    view.rerender(
      <PaneLayoutMobile requestedPane={{ index: 1, id: 1 }}>
        <div key="main">Main</div>
        <div key="side">Side</div>
      </PaneLayoutMobile>
    );
    expect(trackStyle(view.container)).toContain('calc(-0%');

    view.rerender(
      <PaneLayoutMobile requestedPane={{ index: 1, id: 2 }}>
        <div key="main">Main</div>
        <div key="side">Side</div>
      </PaneLayoutMobile>
    );
    expect(trackStyle(view.container)).toContain('calc(-100%');
  });
});
