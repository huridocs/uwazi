/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import { localeAtom, templatesAtom, translationsAtom } from '#V2/atoms/index.js';
import type { ClientTemplateSchema } from '#V2/shared/types.js';
import { EntityTypeChip } from '../EntityTypeChip.js';

const templates: ClientTemplateSchema[] = [
  {
    _id: 'template-hearing',
    name: 'Audiencia',
    color: '#eab308',
    default: false,
  },
];

const translations = [
  {
    locale: 'en',
    contexts: [{ id: 'template-hearing', label: 'Audiencia', values: {} }],
  },
];

const renderChip = (templateId = 'template-hearing') =>
  render(
    <TestAtomStoreProvider
      initialValues={[
        [localeAtom, 'en'],
        [templatesAtom, templates],
        [translationsAtom, translations],
      ]}
    >
      <EntityTypeChip templateId={templateId} />
    </TestAtomStoreProvider>
  );

describe('EntityTypeChip', () => {
  it('renders a collapsed type square with an inset-ringed inner square', () => {
    renderChip();

    expect(screen.getByTestId('entity-type-chip')).toHaveAttribute('title', 'Audiencia');
    expect(screen.getByTestId('entity-type-chip-label')).toHaveClass('hidden');
    expect(screen.getByTestId('entity-type-chip').querySelector('[aria-hidden]')).toHaveClass(
      'ring-1',
      'ring-inset',
      'ring-ink/20',
      'h-[0.4375rem]',
      'w-[0.4375rem]'
    );
  });

  it('reveals the template name on hover', async () => {
    const user = userEvent.setup();
    renderChip();

    await user.hover(screen.getByTestId('entity-type-chip'));
    expect(screen.getByTestId('entity-type-chip-label')).toHaveClass('inline-flex');
    expect(screen.getByTestId('entity-type-chip-label')).not.toHaveClass('hidden');
    expect(screen.getByTestId('entity-type-chip-label')).toHaveTextContent('Audiencia');
  });

  it('renders nothing without a matching template', () => {
    renderChip('missing');
    expect(screen.queryByTestId('entity-type-chip')).not.toBeInTheDocument();
  });
});
