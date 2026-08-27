/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import type { TextSelection } from '@huridocs/react-text-selection-handler';
import { DocumentSelectionFloatingMenu } from '../DocumentSelectionFloatingMenu.js';
import { placeSelectionMenu, SELECTION_MENU_PAD } from '../placeSelectionMenu.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => children,
  t: (_context: string, key: string) => key,
}));

const selection: TextSelection = {
  text: 'selected',
  selectionRectangles: [{ top: 10, left: 20, width: 40, height: 8, regionId: '1' }],
};

const clientRect = (left: number, top: number, width: number, height: number) => ({
  x: left,
  y: top,
  left,
  top,
  width,
  height,
  right: left + width,
  bottom: top + height,
  toJSON: () => ({}),
});

const viewport = { width: 800, height: 600 };
const size = { width: 300, height: 40 };

describe('placeSelectionMenu', () => {
  it('centers on the anchor when the menu fits', () => {
    expect(placeSelectionMenu({ x: 400, y: 200 }, size, viewport)).toEqual({
      left: 250,
      top: 152,
    });
  });

  it('clamps left near the viewport right', () => {
    expect(placeSelectionMenu({ x: 790, y: 200 }, size, viewport).left).toBe(
      viewport.width - SELECTION_MENU_PAD - size.width
    );
  });

  it('clamps left near the viewport left', () => {
    expect(placeSelectionMenu({ x: 10, y: 200 }, size, viewport).left).toBe(SELECTION_MENU_PAD);
  });

  it('clamps top near the viewport top', () => {
    expect(placeSelectionMenu({ x: 400, y: 20 }, size, viewport).top).toBe(SELECTION_MENU_PAD);
  });

  it('clamps top near the viewport bottom', () => {
    expect(placeSelectionMenu({ x: 400, y: 610 }, size, viewport).top).toBe(
      viewport.height - SELECTION_MENU_PAD - size.height
    );
  });
});

describe('DocumentSelectionFloatingMenu', () => {
  let page: HTMLDivElement;

  beforeEach(() => {
    page = document.createElement('div');
    page.id = 'page-1-container';
    document.body.appendChild(page);
    Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 800 });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      writable: true,
      value: 600,
    });
  });

  afterEach(() => {
    page.remove();
    jest.restoreAllMocks();
  });

  it('hides Fill without armedLabel', () => {
    render(
      <DocumentSelectionFloatingMenu
        selection={selection}
        onCreateRelationship={jest.fn()}
        onAddToToC={jest.fn()}
      />
    );

    expect(screen.queryByTestId('fill-from-selection')).not.toBeInTheDocument();
    expect(screen.getByText('Create relationship')).toBeInTheDocument();
    expect(screen.getByText('Add to ToC')).toBeInTheDocument();
  });

  it('shows Fill and calls onFillFromSelection', () => {
    const onFillFromSelection = jest.fn();
    const onCreateRelationship = jest.fn();
    const onAddToToC = jest.fn();

    render(
      <DocumentSelectionFloatingMenu
        selection={selection}
        onCreateRelationship={onCreateRelationship}
        onAddToToC={onAddToToC}
        armedLabel="Title"
        onFillFromSelection={onFillFromSelection}
      />
    );

    fireEvent.click(screen.getByTestId('fill-from-selection'));
    expect(onFillFromSelection).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('fill-from-selection')).toHaveTextContent('Fill');
    expect(screen.getByTestId('fill-from-selection')).toHaveTextContent('Title');

    fireEvent.click(screen.getByText('Create relationship'));
    fireEvent.click(screen.getByText('Add to ToC'));
    expect(onCreateRelationship).toHaveBeenCalledTimes(1);
    expect(onAddToToC).toHaveBeenCalledTimes(1);
  });

  it('portals the menu into document.body with tw-content chrome host and inline fixed', () => {
    render(
      <DocumentSelectionFloatingMenu
        selection={selection}
        onCreateRelationship={jest.fn()}
        onAddToToC={jest.fn()}
      />
    );

    const menu = screen.getByTestId('document-selection-floating-menu');
    expect(menu.parentElement).toBe(document.body);
    expect(menu).toHaveClass('tw-content', 'tw-content--chrome');
    expect(menu).not.toHaveClass('fixed');
    expect(menu.style.position).toBe('fixed');
    expect(menu.style.display).toBe('inline-flex');
    expect(menu.style.zIndex).toBe('50');
    expect(menu.style.transform).toBe('');
  });

  it('centers left/top on the selection without transform', () => {
    const pageRect = clientRect(410, 40, 380, 460);
    const menuWidth = 200;
    const menuHeight = 40;
    const original = HTMLElement.prototype.getBoundingClientRect;
    jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function mockRect(
      this: HTMLElement
    ) {
      if (this.getAttribute('data-testid') === 'document-selection-floating-menu') {
        return clientRect(0, 0, menuWidth, menuHeight);
      }
      if (this.id === 'page-1-container') {
        return pageRect;
      }
      return original.call(this);
    });

    render(
      <DocumentSelectionFloatingMenu
        selection={selection}
        onCreateRelationship={jest.fn()}
        onAddToToC={jest.fn()}
      />
    );

    const menu = screen.getByTestId('document-selection-floating-menu');
    const selectionX = pageRect.left + 20 + 20;
    const selectionY = pageRect.top + 10;
    const expected = placeSelectionMenu(
      { x: selectionX, y: selectionY },
      { width: menuWidth, height: menuHeight },
      { width: window.innerWidth, height: window.innerHeight }
    );
    expect(Number.parseFloat(menu.style.left)).toBe(expected.left);
    expect(Number.parseFloat(menu.style.top)).toBe(expected.top);
    expect(menu.style.transform).toBe('');
  });

  it('clamps left/top near the viewport right and top', () => {
    const pageRect = clientRect(410, 40, 380, 460);
    const menuWidth = 300;
    const menuHeight = 40;
    const nearRight: TextSelection = {
      text: 'selected',
      selectionRectangles: [{ top: 10, left: 360, width: 40, height: 8, regionId: '1' }],
    };

    const original = HTMLElement.prototype.getBoundingClientRect;
    jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function mockRect(
      this: HTMLElement
    ) {
      if (this.getAttribute('data-testid') === 'document-selection-floating-menu') {
        return clientRect(0, 0, menuWidth, menuHeight);
      }
      if (this.id === 'page-1-container') {
        return pageRect;
      }
      return original.call(this);
    });

    render(
      <DocumentSelectionFloatingMenu
        selection={nearRight}
        onCreateRelationship={jest.fn()}
        onAddToToC={jest.fn()}
        armedLabel="Date"
        onFillFromSelection={jest.fn()}
      />
    );

    const menu = screen.getByTestId('document-selection-floating-menu');
    const selectionX = pageRect.left + 360 + 20;
    const selectionY = pageRect.top + 10;
    const expected = placeSelectionMenu(
      { x: selectionX, y: selectionY },
      { width: menuWidth, height: menuHeight },
      { width: window.innerWidth, height: window.innerHeight }
    );
    expect(Number.parseFloat(menu.style.left)).toBe(expected.left);
    expect(Number.parseFloat(menu.style.top)).toBe(expected.top);
    expect(expected.left).toBe(window.innerWidth - SELECTION_MENU_PAD - menuWidth);
    expect(expected.top).toBe(SELECTION_MENU_PAD);
    expect(menu.style.transform).toBe('');
    expect(screen.getByTestId('fill-from-selection')).toHaveTextContent('Fill');
  });
});
