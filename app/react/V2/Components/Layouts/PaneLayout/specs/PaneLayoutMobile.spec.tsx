/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { PaneLayoutMobile } from '../PaneLayoutMobile.js';

const panes = (request?: { index: number; id: number }, extra?: React.ReactElement) =>
  render(
    <PaneLayoutMobile requestedPane={request}>
      <div key="main">Main</div>
      <div key="side">Side</div>
      {extra ?? <div key="deep">Deep</div>}
    </PaneLayoutMobile>
  );

const dialogs = () => document.querySelectorAll('[role="dialog"]');

const layout = (request: { index: number; id: number }) => (
  <PaneLayoutMobile requestedPane={request}>
    <div key="main">Main</div>
    <div key="side">Side</div>
    <div key="deep">Deep</div>
  </PaneLayoutMobile>
);

const expectPage = (container: HTMLElement) => {
  expect(screen.getByText('Main')).toBeInTheDocument();
  expect(container.querySelector('[data-testid="pane-track"]')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Previous' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Next' })).toBeNull();
};

const sheetHost = () => document.querySelector('.tw-content:not(.fixed)') ?? document.body;

const expectSheet = (text: string) => {
  expect(dialogs()).toHaveLength(1);
  expect(dialogs()[0]).toHaveTextContent(text);
  expect(dialogs()[0].parentElement).toBe(sheetHost());
  expect(document.body.style.overflow).toBe('hidden');
};

const expectStack = () => {
  const backdrops = document.querySelectorAll('[data-part="backdrop"]');
  expect(dialogs()).toHaveLength(2);
  expect(dialogs()[0]).toHaveAttribute('inert');
  expect(dialogs()[0].getAttribute('style') ?? '').toContain('scale(0.97)');
  expect(dialogs()[1]).toHaveTextContent('Deep');
  expect(backdrops[0]).toHaveStyle({ opacity: '1' });
  expect(backdrops[1]).toHaveStyle({ opacity: '0' });
  expect(screen.getByRole('button', { name: 'Close all' })).toHaveTextContent('Close all');
};

const expectPopped = () => {
  expect(dialogs()).toHaveLength(1);
  expect(dialogs()[0]).toHaveTextContent('Side');
  expect(dialogs()[0]).not.toHaveAttribute('inert');
  expect(screen.queryByRole('button', { name: 'Close all' })).toBeNull();
};

describe('PaneLayoutMobile', () => {
  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('ports the sheet into the themed content root', () => {
    const host = document.createElement('div');
    host.className = 'tw-content';
    document.body.append(host);
    panes({ index: 1, id: 1 });
    expect(dialogs()[0].parentElement).toBe(host);
    host.remove();
  });

  it('keeps pane 0 on the page and opens the requested pane as a dialog', () => {
    const view = panes({ index: 1, id: 1 });
    expectPage(view.container);
    expectSheet('Side');
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(dialogs()).toHaveLength(0);
    view.rerender(layout({ index: 1, id: 1 }));
    expect(dialogs()).toHaveLength(0);
    view.rerender(layout({ index: 1, id: 2 }));
    expectSheet('Side');
  });

  it('stacks a later pane, pops one with Back, and closes the stack with Close all', () => {
    const view = panes({ index: 2, id: 1 });
    expectStack();
    expect(screen.getByText('Main').closest('[role="dialog"]')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /^Back/ }));
    expectPopped();
    view.rerender(layout({ index: 2, id: 3 }));
    fireEvent.click(screen.getByRole('button', { name: 'Close all' }));
    expect(dialogs()).toHaveLength(0);
    expect(document.body.style.overflow).toBe('');
  });

  it('pops one level when the top sheet is dragged down past 120px', () => {
    panes({ index: 1, id: 1 });
    const handle = document.querySelector('[data-part="handle"]');
    if (!(handle instanceof Element)) throw new Error('handle');
    const pointer = (type: 'pointerdown' | 'pointermove' | 'pointerup', clientY: number) =>
      fireEvent(handle, new MouseEvent(type, { bubbles: true, clientY }));
    pointer('pointerdown', 100);
    pointer('pointermove', 230);
    pointer('pointerup', 230);
    expect(dialogs()).toHaveLength(0);
  });
});
