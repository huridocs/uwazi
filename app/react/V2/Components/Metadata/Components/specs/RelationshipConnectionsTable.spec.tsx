/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import { RelationshipConnectionsTable } from '../RelationshipConnectionsTable.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  I18NLinkV2: ({ children, ...props }: { children: React.ReactNode; to: string }) => (
    <a href={props.to}>{children}</a>
  ),
}));

jest.mock('#V2/Components/UI/TemplatePill.js', () => ({
  TemplatePill: ({ label }: { label: string }) => <span>{label}</span>,
}));

const renderTable = (
  columns: {
    label: string;
    inheritedType?: string;
    cellsByEntityId?: Record<string, React.ReactNode>;
  }[] = [{ label: 'Inherited', cellsByEntityId: { e1: 'Value' } }]
) =>
  render(
    <RelationshipConnectionsTable
      rows={[{ id: 'e1', label: 'Alpha', templateId: 't1' }]}
      columns={columns}
    />
  );

const tableEl = () => screen.getByRole('table');

const rowEl = (label: string) => {
  const row = within(tableEl()).getByText(label).closest('tr');
  expect(row).toBeInstanceOf(HTMLElement);
  if (!(row instanceof HTMLElement)) {
    throw new Error('missing row');
  }
  return row;
};

describe('RelationshipConnectionsTable layout', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('limits a long edit-form text value until Show more', async () => {
    jest.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(200);
    jest.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(40);
    const user = userEvent.setup();
    render(
      <RelationshipConnectionsTable
        preview
        rows={[{ id: 'e1', label: 'Second', templateId: 't1' }]}
        columns={[
          {
            label: 'Markdown',
            inheritedType: 'markdown',
            cellsByEntityId: { e1: 't is a long established fact' },
          },
        ]}
      />
    );

    expect(screen.getByText('t is a long established fact').closest('.max-h-24')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Show more' }));
    const toggle = screen.getByRole('button', { name: 'Show less' });
    expect(screen.getByText('t is a long established fact').closest('.max-h-24')).toBeNull();
    expect(toggle.closest('td')).toHaveTextContent('t is a long established fact');
    expect(toggle.closest('td')).not.toHaveTextContent('Second');
  });

  it('shows geolocation and record values in full', () => {
    jest.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(200);
    jest.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(40);
    const { rerender } = render(
      <RelationshipConnectionsTable
        preview
        rows={[{ id: 'e1', label: 'Second', templateId: 't1' }]}
        columns={[
          { label: 'Geolocation', inheritedType: 'geolocation', cellsByEntityId: { e1: 'map' } },
        ]}
      />
    );
    expect(screen.queryByRole('button', { name: 'Show more' })).not.toBeInTheDocument();

    rerender(
      <RelationshipConnectionsTable
        rows={[{ id: 'e1', label: 'Second', templateId: 't1' }]}
        columns={[
          { label: 'Markdown', inheritedType: 'markdown', cellsByEntityId: { e1: 'full text' } },
        ]}
      />
    );
    expect(screen.queryByRole('button', { name: 'Show more' })).not.toBeInTheDocument();
  });

  it('opens the entity overlay from the entity pill', async () => {
    const user = userEvent.setup();
    const onOpenEntity = jest.fn();
    render(
      <RelationshipConnectionsTable
        rows={[{ id: 'ecuador', label: 'Ecuador', templateId: 'country' }]}
        onOpenEntity={onOpenEntity}
      />
    );

    await user.click(within(tableEl()).getByRole('button', { name: 'Ecuador' }));

    expect(onOpenEntity).toHaveBeenCalledWith({
      sharedId: 'ecuador',
      title: 'Ecuador',
      templateId: 'country',
    });
  });

  it('renders a table that fills the field', () => {
    const { container } = renderTable();
    expect(screen.getByTestId('relationship-connections')).toBeInTheDocument();
    expect(screen.queryByTestId('connection-card-stack')).not.toBeInTheDocument();
    expect(screen.getByRole('table').className).toContain('w-full');
    expect(container.querySelector('.overflow-x-auto')).toBeNull();
  });

  it('sets the table width from the field', () => {
    const { container } = renderTable();
    const root = screen.getByTestId('relationship-connections');
    expect(root.querySelector('[data-connections-probe]')).toBeNull();
    expect(root.querySelector('.overflow-x-auto')).toBeNull();
    expect(tableEl().className).toContain('w-full');
    expect(tableEl().className).toContain('border-collapse');
    expect(tableEl().className).not.toContain('min-w-max');
    expect(tableEl().className).not.toContain('table-fixed');
    expect(container.querySelector('col')).toBeNull();
  });

  it('places the entity pill in the first column and inherited properties after it', () => {
    render(
      <RelationshipConnectionsTable
        rows={[{ id: 'e1', label: 'Ana', templateId: 't1' }]}
        columns={[{ label: 'Country', cellsByEntityId: { e1: 'Kenya' } }]}
      />
    );
    const headers = within(tableEl()).getAllByRole('columnheader');
    expect(headers[0]).toHaveTextContent('Entity');
    expect(headers[0].querySelector('svg')).toBeNull();
    expect(headers[1]).toHaveTextContent('Country');
    expect(headers[1].querySelector('svg')).toBeTruthy();
    expect(
      headers[0].className.includes('text-meta') && headers[1].className.includes('tracking-wider')
    ).toBe(true);
    const cells = within(rowEl('Ana')).getAllByRole('cell');
    expect(cells[0]).toHaveTextContent('Ana');
    expect(cells[1]).toHaveTextContent('Kenya');
  });

  it('names the entity column from the target template', () => {
    render(
      <TestAtomStoreProvider
        initialValues={[[templatesAtom, [{ _id: 'person-tmpl', name: 'Person', properties: [] }]]]}
      >
        <RelationshipConnectionsTable
          rows={[{ id: 'e1', label: 'Ana', templateId: 'person-tmpl' }]}
          columns={[{ label: 'Country', cellsByEntityId: { e1: 'Kenya' } }]}
          targetTemplateId="person-tmpl"
        />
      </TestAtomStoreProvider>
    );
    expect(within(tableEl()).getByRole('columnheader', { name: 'Person' })).toBeInTheDocument();
  });

  it('merges repeated inherit values with rowSpan', () => {
    render(
      <RelationshipConnectionsTable
        rows={[
          { id: 'e1', label: 'Ana', templateId: 't1' },
          { id: 'e2', label: 'Ben', templateId: 't1' },
        ]}
        columns={[{ label: 'Country', cellsByEntityId: { e1: 'Kenya', e2: 'Kenya' } }]}
      />
    );
    const kenya = within(tableEl()).getByText('Kenya');
    expect(kenya.closest('td')).toHaveAttribute('rowSpan', '2');
    expect(within(tableEl()).getAllByText('Kenya')).toHaveLength(1);
  });
});

describe('RelationshipConnectionsTable cells', () => {
  it('lists each entity with its inherited values', () => {
    render(
      <RelationshipConnectionsTable
        rows={[
          { id: 'e1', label: 'Alpha', templateId: 't1' },
          { id: 'e2', label: 'Beta', templateId: 't1' },
        ]}
        columns={[
          { label: 'Country', cellsByEntityId: { e1: 'Kenya', e2: 'Kenya' } },
          { label: 'Role', cellsByEntityId: { e1: 'Judge', e2: 'Clerk' } },
        ]}
      />
    );
    expect(within(tableEl()).getByText('Kenya')).toBeInTheDocument();
    expect(within(tableEl()).getByText('Judge')).toBeInTheDocument();
    expect(within(tableEl()).getByText('Clerk')).toBeInTheDocument();
  });

  it('shows the row action in the table', () => {
    render(
      <RelationshipConnectionsTable
        rows={[{ id: 'e1', label: 'Alpha', templateId: 't1' }]}
        columns={[{ label: 'Country', cellsByEntityId: { e1: 'Kenya' } }]}
        renderActions={row => <button type="button">Remove {row.label}</button>}
      />
    );
    expect(within(tableEl()).getByRole('button', { name: 'Remove Alpha' })).toBeInTheDocument();
  });

  it('wraps geolocation, media, and image values in their columns', () => {
    renderTable([
      { label: 'Loc', inheritedType: 'geolocation', cellsByEntityId: { e1: 'g' } },
      { label: 'Clip', inheritedType: 'media', cellsByEntityId: { e1: 'm' } },
      { label: 'Photo', inheritedType: 'image', cellsByEntityId: { e1: 'i' } },
    ]);
    const classes = within(rowEl('Alpha'))
      .getAllByRole('cell')
      .map(cell => cell.className)
      .join(' ');
    expect(classes).toContain('min-w-0');
    expect(classes).toContain('break-words');
    expect(/min-w-(72|64|48)/.test(classes)).toBe(false);
  });

  it('renders an em dash when inherited cells are empty', () => {
    renderTable([{ label: 'Country', cellsByEntityId: {} }]);
    const row = rowEl('Alpha');
    expect(within(row).getByText('—')).toBeInTheDocument();
  });

  it('exposes column scope and a screen-reader caption', () => {
    const { container } = renderTable([{ label: 'Country', cellsByEntityId: { e1: 'Kenya' } }]);
    const table = container.querySelector('table');
    expect(table).toBeInstanceOf(HTMLElement);
    if (!(table instanceof HTMLElement)) {
      throw new Error('missing table');
    }
    expect(table.querySelector('caption')?.textContent).toBe('Connected entities — Country');
    within(table)
      .getAllByRole('columnheader')
      .forEach(header => {
        expect(header).toHaveAttribute('scope', 'col');
      });
  });
});
