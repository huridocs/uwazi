/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RelationshipFieldEditor } from '../RelationshipFieldEditor.js';
import type { MultiselectListOption } from '#V2/Components/Forms/index.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  t: (_context: string, key: string) => key,
}));

jest.mock('#V2/Components/UI/TemplatePill.js', () => ({
  TemplatePill: ({ label }: { label: string }) => <span>{label}</span>,
}));

jest.mock('#V2/Components/Metadata/Components/RelationshipConnectionsTable.js', () => ({
  RelationshipConnectionsTable: () => null,
}));

jest.mock('#V2/Components/Metadata/Components/RelationCaption.js', () => ({
  RelationCaption: () => null,
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
  await user.click(screen.getByRole('button', { name: '3 x more' }));
  expect(screen.getByText('Entity 8')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'x less' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /322 more options/ })).toBeInTheDocument();
};

describe('RelationshipFieldEditor', () => {
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
});
