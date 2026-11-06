/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { TestAtomStoreProvider } from '#V2/testing/index.js';
import { relationshipTypesAtom } from '#V2/atoms/relationshipTypes.js';
import { Relationship } from '../Relationship.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <span className={className}>{children}</span>
  ),
  I18NLinkV2: ({ children, ...props }: { children: React.ReactNode; to: string }) => (
    <a href={props.to}>{children}</a>
  ),
}));

jest.mock('#V2/Components/UI/TemplatePill.js', () => ({
  TemplatePill: ({ label }: { label: string }) => <span>{label}</span>,
}));

const renderRelationship = (
  label: string,
  relationName: string,
  columns: { label: string; cellsByEntityId: Record<string, string> }[] = [
    { label: 'Country', cellsByEntityId: { e1: 'Kenya' } },
  ]
) =>
  render(
    <TestAtomStoreProvider
      initialValues={[[relationshipTypesAtom, [{ _id: 'rel-1', name: relationName }]]]}
    >
      <Relationship
        label={label}
        translationContext="case-tmpl"
        values={[{ _id: 'e1', title: 'Ada', templateId: 'person-tmpl' }]}
        relationTypeId="rel-1"
        columns={columns}
      />
    </TestAtomStoreProvider>
  );

describe('Relationship caption', () => {
  it('shows the field title and the relationship type under it', () => {
    renderRelationship('People involved', 'People');

    const title = screen.getByRole('heading', { name: 'People involved' });
    expect(title.parentElement?.querySelector('svg')).toBeNull();
    expect(screen.getByText('People')).toBeInTheDocument();
    expect(screen.getByText('Relationship:')).toHaveClass('sr-only');
  });

  it('shows the connected entity when there are no inherited properties', () => {
    renderRelationship('People involved', 'People', []);

    const table = screen.getByRole('table');
    expect(within(table).getByText('Ada')).toBeInTheDocument();
    expect(within(table).getAllByRole('columnheader')).toHaveLength(1);
  });

  it('shows only the title when the relationship type matches it aside from case, accents, and spaces', () => {
    renderRelationship('  Relación  ', 'relacion');

    expect(screen.getByRole('heading', { name: 'Relación' })).toBeInTheDocument();
    expect(screen.queryByText('Relationship:')).not.toBeInTheDocument();
    expect(screen.queryByText('relacion')).not.toBeInTheDocument();
  });
});
