/**
 * @jest-environment jsdom
 */
import { screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { renderRelationshipsPanel } from './helpers/renderRelationshipsPanel.js';

beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
});

const hoverTip = async (user: UserEvent, button: HTMLElement, label: string) => {
  const trigger = button.parentElement;
  if (!trigger) throw new Error('collapse control has no tooltip target');
  await user.hover(trigger);
  expect(await screen.findByRole('tooltip')).toHaveTextContent(label);
  await user.unhover(trigger);
};

const readControls = (collapseDisabled: boolean) => {
  const collapse = screen.getByRole('button', { name: 'Collapse all' });
  const expand = screen.getByRole('button', { name: 'Expand all' });
  if (collapseDisabled) {
    expect(collapse).toBeDisabled();
    expect(expand).toBeEnabled();
  } else {
    expect(collapse).toBeEnabled();
    expect(expand).toBeDisabled();
  }
  return { collapse, expand };
};

describe('Relationship collapse controls', () => {
  it('disables collapse or expand when every group is already in that state', async () => {
    const user = userEvent.setup();
    renderRelationshipsPanel();
    const collapsed = readControls(true);
    await hoverTip(user, collapsed.collapse, 'Collapse all');

    await user.click(screen.getByRole('button', { name: 'Related 2' }));
    const opened = readControls(false);
    await hoverTip(user, opened.expand, 'Expand all');

    await user.click(opened.collapse);
    readControls(true);
  });
});
