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
  Translate: ({ children }: { children: React.ReactNode }) => children,
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

const cardStack = () => screen.getByTestId('connection-card-stack');

const rowEl = (label: string) => {
  const row = within(tableEl()).getByText(label).closest('tr');
  expect(row).toBeInstanceOf(HTMLElement);
  if (!(row instanceof HTMLElement)) {
    throw new Error('missing row');
  }
  return row;
};

describe('RelationshipConnectionsTable layout', () => {
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

  it('keeps the table inside the field when it fits', () => {
    const { container } = renderTable();
    expect(screen.getByTestId('relationship-connections')).toBeInTheDocument();
    expect(screen.queryByTestId('connection-card-stack')).not.toBeInTheDocument();
    expect(container.querySelector('.overflow-x-auto')).not.toBeNull();
    const tableClass = container.querySelector('table')?.className ?? '';
    expect(tableClass.includes('w-max') && !tableClass.includes('w-full')).toBe(true);
  });

  it('puts inherit columns first and the entity last', () => {
    render(
      <RelationshipConnectionsTable
        rows={[{ id: 'e1', label: 'Ana', templateId: 't1' }]}
        columns={[{ label: 'Country', cellsByEntityId: { e1: 'Kenya' } }]}
      />
    );
    const headers = within(tableEl()).getAllByRole('columnheader');
    expect(headers[0]).toHaveTextContent('Country');
    expect(headers[headers.length - 1]).toHaveTextContent('Entity');
    const cells = within(rowEl('Ana')).getAllByRole('cell');
    expect(cells[0]).toHaveTextContent('Kenya');
    expect(cells[1]).toHaveTextContent('Ana');
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
  it('places distinct rollups on inherit column headers', () => {
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
    expect(within(tableEl()).getByText('1 distinct')).toBeInTheDocument();
    expect(within(tableEl()).getByText('2 distinct')).toBeInTheDocument();
  });

  it('keeps edit actions on the table', () => {
    render(
      <RelationshipConnectionsTable
        rows={[{ id: 'e1', label: 'Alpha', templateId: 't1' }]}
        columns={[{ label: 'Country', cellsByEntityId: { e1: 'Kenya' } }]}
        renderActions={row => <button type="button">Remove {row.label}</button>}
      />
    );
    expect(within(tableEl()).getByRole('button', { name: 'Remove Alpha' })).toBeInTheDocument();
  });

  it('sizes entity last and scalar inherited cells first', () => {
    renderTable();
    const cells = within(rowEl('Alpha')).getAllByRole('cell');
    expect(cells[0].className).toContain('min-w-0');
    expect(cells[1].className).toContain('max-w-40');
    expect(cells[1].className).not.toContain('min-w-0');
  });

  it('applies type min-widths for geo media and image columns', () => {
    renderTable([
      { label: 'Loc', inheritedType: 'geolocation', cellsByEntityId: { e1: 'g' } },
      { label: 'Clip', inheritedType: 'media', cellsByEntityId: { e1: 'm' } },
      { label: 'Photo', inheritedType: 'image', cellsByEntityId: { e1: 'i' } },
    ]);
    const row = rowEl('Alpha');
    const cells = within(row).getAllByRole('cell');
    const headers = within(tableEl()).getAllByRole('columnheader');
    expect(cells[0].className).toContain('min-w-72');
    expect(cells[1].className).toContain('min-w-64');
    expect(cells[2].className).toContain('min-w-48');
    expect(headers[0].className).toContain('min-w-72');
    expect(headers[1].className).toContain('min-w-64');
    expect(headers[2].className).toContain('min-w-48');
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

describe('RelationshipConnectionsTable cards', () => {
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get() {
        return this.hasAttribute('data-connections-root') ? 400 : 0;
      },
    });
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
      configurable: true,
      get() {
        return this.hasAttribute('data-connections-probe') ? 600 : 0;
      },
    });
  });

  afterEach(() => {
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get() {
        return 0;
      },
    });
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
      configurable: true,
      get() {
        return 0;
      },
    });
  });

  it('places distinct rollups on the card set, not each card', () => {
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
    const stack = cardStack();
    expect(within(stack).getAllByText('1 distinct')).toHaveLength(1);
    expect(within(stack).getAllByText('Kenya')).toHaveLength(2);
  });

  it('repeats inherit labels and values on each card', () => {
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
    const stack = cardStack();
    expect(within(stack).getAllByText('Country')).toHaveLength(3);
    expect(within(stack).getByText('Judge')).toBeInTheDocument();
    expect(within(stack).getByText('Clerk')).toBeInTheDocument();
  });

  it('keeps edit actions on each card', () => {
    render(
      <RelationshipConnectionsTable
        rows={[{ id: 'e1', label: 'Alpha', templateId: 't1' }]}
        columns={[{ label: 'Country', cellsByEntityId: { e1: 'Kenya' } }]}
        renderActions={row => <button type="button">Remove {row.label}</button>}
      />
    );
    expect(within(cardStack()).getByRole('button', { name: 'Remove Alpha' })).toBeInTheDocument();
  });
});
