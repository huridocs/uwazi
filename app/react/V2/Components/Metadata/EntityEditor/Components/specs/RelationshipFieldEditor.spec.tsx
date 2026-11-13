/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RelationshipFieldEditor } from '../RelationshipFieldEditor.js';
import type { MultiselectListOption } from '#V2/Components/Forms/index.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <span className={className}>{children}</span>
  ),
  t: (_context: string, key: string) => key,
}));

jest.mock('#V2/Components/UI/TemplatePill.js', () => ({
  TemplatePill: ({ label }: { label: string }) => <span>{label}</span>,
}));

jest.mock('#V2/Components/Metadata/Components/EntityOverlayPill.js', () => ({
  EntityOverlayPill: ({
    label,
    sharedId,
    templateId,
    onOpenEntity,
  }: {
    label: string;
    sharedId: string;
    templateId: string;
    onOpenEntity?: (target: { sharedId: string; title: string; templateId: string }) => void;
  }) => (
    <button type="button" onClick={() => onOpenEntity?.({ sharedId, title: label, templateId })}>
      {label}
    </button>
  ),
}));

jest.mock('#V2/Components/Metadata/Components/RelationshipConnectionsTable.js', () => ({
  RelationshipConnectionsTable: () => null,
}));

const options: MultiselectListOption[] = Array.from({ length: 8 }, (_, index) => ({
  label: `Entity ${index + 1}`,
  searchLabel: `entity ${index + 1}`,
  value: `e${index + 1}`,
}));

const expandCandidates = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: 'Add entity' }));
  await waitFor(() => expect(screen.getByText('Entity 1')).toBeInTheDocument());
  expect(screen.queryByText('Entity 6')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '325 x more' }));
  expect(screen.getByText('Entity 8')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'x less' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /322 more options/ })).toBeInTheDocument();
};

describe('RelationshipFieldEditor', () => {
  it('shows the relationship type under the field title', () => {
    const { container } = render(
      <RelationshipFieldEditor
        title="Contractors"
        relationLabel="Works with"
        values={[]}
        onChange={jest.fn()}
      />
    );

    expect(screen.getByText('Contractors')).toBeInTheDocument();
    expect(screen.getByText('Works with').closest('p')).toHaveClass('text-meta');
    expect(screen.getByText('Relationship').parentElement).toHaveClass('sr-only');
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('shows only the title when the relationship type matches it', () => {
    render(
      <RelationshipFieldEditor
        title="People"
        relationLabel=" péople "
        values={[]}
        onChange={jest.fn()}
      />
    );

    expect(screen.queryByText('Relationship')).not.toBeInTheDocument();
    expect(screen.queryByText(/péople/)).not.toBeInTheDocument();
  });

  it('puts the inherited-values note on the icon next to add entity', () => {
    render(
      <RelationshipFieldEditor
        title="Contractors"
        values={[]}
        onChange={jest.fn()}
        columns={[{ label: 'Note' }]}
      />
    );

    expect(
      screen.getByRole('button', {
        name: 'Inherited values are read-only. Change the connection above, or edit the source entity.',
      })
    ).toBeInTheDocument();
  });

  it('loads the remaining candidates when more options is clicked', async () => {
    const user = userEvent.setup();
    const lookupSearch = jest.fn(async (_search: string, offset = 0) => {
      if (offset > 0) {
        return {
          options: [{ label: 'Entity 9', searchLabel: 'entity 9', value: 'e9' }],
          total: 330,
          fetched: 322,
        };
      }
      return { options, total: 330, fetched: 8 };
    });
    render(
      <RelationshipFieldEditor
        title="Contractors"
        values={[]}
        onChange={jest.fn()}
        searchId="contractors"
        lookupSearch={lookupSearch}
      />
    );

    await expandCandidates(user);
    await user.click(screen.getByRole('button', { name: /322 more options/ }));

    expect(lookupSearch).toHaveBeenLastCalledWith('', 8);
    expect(await screen.findByText('Entity 9')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /more options/ })).not.toBeInTheDocument();
  });

  it('opens the entity overlay from the pill', async () => {
    const user = userEvent.setup();
    const onEditSource = jest.fn();
    render(
      <RelationshipFieldEditor
        title="Contractor"
        values={[{ value: 'alpha', label: 'Alpha' }]}
        onChange={jest.fn()}
        onEditSource={onEditSource}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Alpha' }));
    expect(onEditSource).toHaveBeenCalledWith('alpha', 'Alpha');
    expect(screen.queryByRole('button', { name: 'View entity' })).not.toBeInTheDocument();
  });

  it('folds selected values the way the read view does', () => {
    const titles = [
      'Zeta',
      'Alpha',
      'Mike',
      'Bravo',
      'Charlie',
      'Delta',
      'Echo',
      'Foxtrot',
      'Golf',
      'Hotel',
      'India',
    ];
    render(
      <RelationshipFieldEditor
        title="Contractor"
        values={titles.map(title => ({ value: title, label: title }))}
        onChange={jest.fn()}
      />
    );

    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.queryByText('Zeta')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show all 11' })).toBeInTheDocument();
    expect(screen.getByText('Alpha').compareDocumentPosition(screen.getByText('Bravo'))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  });
});
