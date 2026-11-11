/**
 * @jest-environment jsdom
 */
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderRelationshipsActionBar } from '#V2/Routes/Entity/Components/relationships/specs/helpers/renderRelationshipsActionBar.js';
import { relationshipsFooterCompact } from '../RelationshipsTabFooter.js';

beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
});

describe('relationshipsFooterCompact', () => {
  it('treats 0, 672, and 800 as wide and 320 and 671 as compact', () => {
    expect(relationshipsFooterCompact(0)).toBe(false);
    expect(relationshipsFooterCompact(672)).toBe(false);
    expect(relationshipsFooterCompact(800)).toBe(false);
    expect(relationshipsFooterCompact(320)).toBe(true);
    expect(relationshipsFooterCompact(671)).toBe(true);
  });
});

const widthReads: Array<() => void> = [];
let footerWidth = 0;

class FooterResizeObserver implements ResizeObserver {
  private readonly run: () => void;

  constructor(read: ResizeObserverCallback) {
    this.run = () => {
      read([], this);
    };
  }

  observe() {
    widthReads.push(this.run);
    this.run();
  }

  unobserve() {
    this.disconnect();
  }

  disconnect() {
    const index = widthReads.indexOf(this.run);
    if (index >= 0) widthReads.splice(index, 1);
  }
}

const horizontalPadding = (element: HTMLElement) =>
  element.className.split(/\s+/).filter(token => token.startsWith('px-'));

const expectIconAction = (footer: HTMLElement, name: string) => {
  const button = within(footer).getByRole('button', { name });
  expect(button.querySelector('svg')).not.toBeNull();
  expect(button).not.toHaveTextContent(name);
};

const expectLabeledCreate = (footer: HTMLElement) => {
  expect(horizontalPadding(footer)).toEqual(['px-4']);
  expect(within(footer).getByRole('button', { name: 'Create relationship' })).toHaveTextContent(
    'Create relationship'
  );
};

const expectNarrowIcons = (footer: HTMLElement) => {
  expect(horizontalPadding(footer)).toEqual(['px-3']);
  expectIconAction(footer, 'Create relationship');
  expectIconAction(footer, 'Select all');
  expect(footer.contains(screen.getByRole('button', { name: 'Collapse all' }))).toBe(false);
};

const renderFooter = (width: number) => {
  footerWidth = width;
  renderRelationshipsActionBar({ footer: true });
  return screen.getByTestId('entity-tab-footer');
};

describe('Relationships footer', () => {
  beforeEach(() => {
    widthReads.length = 0;
    footerWidth = 0;
    jest.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => footerWidth);
    global.ResizeObserver = FooterResizeObserver;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows the same edit actions as icons when the footer is narrower than 672', async () => {
    const user = userEvent.setup();
    const footer = renderFooter(671);
    await user.click(within(footer).getByRole('button', { name: 'Edit' }));

    expect(horizontalPadding(footer)).toEqual(['px-3']);
    expectIconAction(footer, 'Create relationship');
    expectIconAction(footer, 'Select all');
    expectIconAction(footer, 'Deselect all');
    expect(within(footer).getByRole('button', { name: 'Cancel' })).toHaveTextContent('Cancel');
    expect(footer.contains(screen.getByRole('button', { name: 'Collapse all' }))).toBe(false);
  });

  it('shows Create relationship as text when the edit footer is at least 672 wide', async () => {
    const user = userEvent.setup();
    const footer = renderFooter(672);
    await user.click(within(footer).getByRole('button', { name: 'Edit' }));

    expect(horizontalPadding(footer)).toEqual(['px-4']);
    expect(within(footer).getByRole('button', { name: 'Create relationship' })).toHaveTextContent(
      'Create relationship'
    );
    expect(within(footer).getByRole('button', { name: 'Select all' })).toHaveTextContent(
      'Select all'
    );
    expect(footer.contains(screen.getByRole('button', { name: 'Collapse all' }))).toBe(false);
  });

  it('shows the labeled Edit button and px-3 when the footer is narrow and idle', () => {
    const footer = renderFooter(320);
    const edit = within(footer).getByRole('button', { name: 'Edit' });

    expect(horizontalPadding(footer)).toEqual(['px-3']);
    expect(edit).toHaveTextContent('Edit');
  });

  it('hides the wide edit bar until the footer has a width', () => {
    const footer = renderFooter(0);

    expect(horizontalPadding(footer)).toEqual(['px-3']);
    expect(within(footer).queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();

    footerWidth = 800;
    act(() => {
      widthReads.forEach(read => read());
    });

    expect(horizontalPadding(footer)).toEqual(['px-4']);
    expect(within(footer).getByRole('button', { name: 'Edit' })).toHaveTextContent('Edit');
  });

  it('updates the edit bar when the footer resizes without ResizeObserver', async () => {
    const user = userEvent.setup();
    Reflect.deleteProperty(global, 'ResizeObserver');
    const footer = renderFooter(800);
    await user.click(within(footer).getByRole('button', { name: 'Edit' }));
    expectLabeledCreate(footer);

    footerWidth = 400;
    await user.click(within(footer).getByRole('button', { name: 'Select all' }));

    expectNarrowIcons(footer);
  });

  it('flips padding and the edit bar when the footer resizes from 800 to 400', async () => {
    const user = userEvent.setup();
    const footer = renderFooter(800);
    await user.click(within(footer).getByRole('button', { name: 'Edit' }));
    expectLabeledCreate(footer);

    footerWidth = 400;
    act(() => {
      widthReads.forEach(read => read());
    });

    expectNarrowIcons(footer);
  });
});
