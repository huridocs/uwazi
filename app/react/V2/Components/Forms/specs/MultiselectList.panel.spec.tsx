/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MultiselectList, type MultiselectListOption } from '../MultiselectList/MultiselectList.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  t: (_context: string, key: string) => key,
}));

const option = (value: string): MultiselectListOption => ({
  label: value,
  searchLabel: value,
  value,
});

const longItems = Array.from({ length: 10 }, (_, index) => option(`Value ${index}`));

const renderPanel = (items: MultiselectListOption[], selected: string[] = []) => {
  render(<MultiselectList panel checkboxes items={items} selectedValues={selected} />);
};

describe('MultiselectList panel', () => {
  it('pins chosen values and folds the rest behind Show more', () => {
    renderPanel(longItems, ['Value 8', 'Value 9']);

    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Selected (2)' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );

    const names = screen.getAllByRole('checkbox').map(input => input.getAttribute('name'));
    expect(names.slice(0, 2)).toEqual(['Value 8', 'Value 9']);
    expect(names).toHaveLength(8);
    expect(screen.getByRole('checkbox', { name: 'Value 8' }).closest('label')).toHaveClass(
      'bg-carbon/[0.04]'
    );

    fireEvent.click(screen.getByRole('button', { name: /Show more/ }));
    expect(screen.getAllByRole('checkbox')).toHaveLength(10);
  });

  it('lists only the chosen values in Selected', () => {
    renderPanel(longItems, ['Value 1']);
    fireEvent.click(screen.getByRole('button', { name: 'Selected (1)' }));
    expect(screen.getAllByRole('checkbox').map(input => input.getAttribute('name'))).toEqual([
      'Value 1',
    ]);
  });

  it('lifts a chosen grouped value above its group', () => {
    renderPanel(
      [
        {
          label: 'Americas',
          searchLabel: 'Americas',
          value: 'americas',
          items: [option('Argentina'), option('Albania')],
        },
      ],
      ['Albania']
    );

    const names = screen.getAllByRole('checkbox').map(input => input.getAttribute('name'));
    expect(names).toEqual(['Albania', 'Argentina']);
    expect(screen.getByRole('checkbox', { name: 'Americas › Albania' })).toBeChecked();
  });

  it('sets the checkbox id to the option value', () => {
    renderPanel([option('thes1.2')]);
    expect(screen.getByRole('checkbox')).toHaveAttribute('id', 'thes1.2');
  });

  it('shows a short list in full, without the switch', () => {
    renderPanel([option('One'), option('Two')]);
    expect(screen.queryByRole('button', { name: 'All' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('checkbox')).toHaveLength(2);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});
