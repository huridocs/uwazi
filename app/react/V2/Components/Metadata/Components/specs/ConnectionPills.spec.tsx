/**
 * @jest-environment jsdom
 */
/* eslint-disable react/no-multi-comp */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ConnectionPills } from '../ConnectionPills.js';
import type { RelationshipEntityValue } from '../connectionPillsHelpers.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  t: (_ctx: string, key: string) => key,
}));

jest.mock('#V2/Components/Metadata/Components/EntityOverlayPill.js', () => ({
  EntityOverlayPill: ({
    label,
    quiet,
    onOpenEntity,
    sharedId,
    templateId,
  }: {
    label: string;
    quiet?: boolean;
    sharedId: string;
    templateId: string;
    onOpenEntity?: (target: { sharedId: string; title: string; templateId: string }) => void;
  }) => (
    <button
      type="button"
      data-testid={`pill-${sharedId}`}
      data-quiet={quiet ? 'true' : 'false'}
      onClick={() => onOpenEntity?.({ sharedId, title: label, templateId })}
    >
      {label}
    </button>
  ),
}));

const entity = (title: string, templateId = 'tmpl-a', id = title): RelationshipEntityValue => ({
  _id: id,
  title,
  templateId,
});

const titled = (count: number) =>
  Array.from({ length: count }, (_, index) =>
    entity(String.fromCharCode(65 + index), 'tmpl-a', `id-${index}`)
  );

describe('ConnectionPills', () => {
  it('shows ten chips and folds the rest', () => {
    render(<ConnectionPills values={titled(11)} />);

    expect(screen.getByTestId('pill-id-0')).toBeInTheDocument();
    expect(screen.queryByTestId('pill-id-10')).not.toBeInTheDocument();
    expect(screen.getByRole('list')).toHaveClass('gap-1.5');
    expect(screen.getByRole('button', { name: /Show all 11/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Show all/ }));
    expect(screen.getByTestId('pill-id-10')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show less' }));
    expect(screen.queryByTestId('pill-id-10')).not.toBeInTheDocument();
  });

  it('keeps the template color when every value shares a template', () => {
    render(<ConnectionPills values={[entity('A'), entity('B')]} targetTemplateId="tmpl-a" />);
    expect(screen.getByTestId('pill-A')).toHaveAttribute('data-quiet', 'false');
    expect(screen.getByTestId('pill-B')).toHaveAttribute('data-quiet', 'false');
  });

  it('keeps tinted pills when templates mix', () => {
    render(<ConnectionPills values={[entity('A', 'tmpl-a'), entity('B', 'tmpl-b')]} />);
    expect(screen.getByTestId('pill-A')).toHaveAttribute('data-quiet', 'false');
    expect(screen.getByTestId('pill-B')).toHaveAttribute('data-quiet', 'false');
  });

  it('opens the entity when a chip is clicked', () => {
    const onOpenEntity = jest.fn();
    render(
      <ConnectionPills
        values={[entity('Alpha')]}
        targetTemplateId="tmpl-a"
        onOpenEntity={onOpenEntity}
      />
    );
    fireEvent.click(screen.getByTestId('pill-Alpha'));
    expect(onOpenEntity).toHaveBeenCalledWith({
      sharedId: 'Alpha',
      title: 'Alpha',
      templateId: 'tmpl-a',
    });
  });
});
