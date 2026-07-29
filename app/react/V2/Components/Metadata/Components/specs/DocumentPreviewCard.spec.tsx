/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { TestAtomStoreProvider } from '#V2/testing/index.js';
import { localeAtom } from '#V2/atoms/translationsAtoms.js';
import type { Entity } from '#V2/api/entities/types.js';
import type { MetadataProperty } from '#V2/formatters/types.js';
import { DocumentPreviewCard } from '../DocumentPreviewCard';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => children,
  t: (_ctx: string, key: string) => key,
}));

const entity: Entity = {
  _id: 'e1',
  sharedId: 's1',
  title: 'Entity',
  template: 'tmpl1',
  language: 'en',
  creationDate: 1,
  user: 'u1',
  documents: [
    {
      _id: 'doc-1',
      filename: 'judgment.pdf',
      originalname: 'Velasquez.pdf',
      mimetype: 'application/pdf',
      size: 218112,
      creationDate: 1710460800,
    },
  ],
};

const renderCard = (entityOverride: Entity = entity, previewField?: MetadataProperty) =>
  render(
    <TestAtomStoreProvider initialValues={[[localeAtom, 'en']]}>
      <DocumentPreviewCard entity={entityOverride} previewField={previewField} />
    </TestAtomStoreProvider>
  );

describe('DocumentPreviewCard', () => {
  it('renders inset thumbnail frame, PDF badge, facts, and view/download actions', () => {
    const { container } = renderCard();

    expect(screen.getByRole('heading', { level: 4, name: 'Document' })).toBeInTheDocument();
    expect(screen.getByText('Velasquez.pdf')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Size')).toBeInTheDocument();
    expect(screen.getByText('Added')).toBeInTheDocument();

    const thumb = screen.getByRole('img', { name: 'Velasquez.pdf' });
    expect(thumb).toHaveAttribute('src', '/api/files/doc-1.jpg');
    expect(thumb).toHaveClass('object-cover', 'object-top');
    expect(thumb.parentElement).toHaveClass('bg-paper');
    expect(thumb.parentElement?.parentElement).toHaveClass('bg-vellum');

    const badge = container.querySelector('.bg-ink\\/70');
    expect(badge).toHaveTextContent('PDF');
    expect(badge).toHaveClass('rounded-[2px]', 'text-pico', 'uppercase');

    expect(screen.getByRole('link', { name: /View/i })).toHaveAttribute(
      'href',
      '/api/files/judgment.pdf'
    );
    expect(screen.getByRole('link', { name: /Download/i })).toHaveAttribute(
      'href',
      '/api/files/judgment.pdf?download=true'
    );
  });

  it('prefers preview property image for the thumbnail', () => {
    renderCard(entity, {
      _id: 'p-preview',
      name: 'preview',
      label: 'Preview',
      type: 'preview',
      style: 'cover',
      values: [{ value: '/api/files/custom-preview.png', alt: 'preview' }],
    });

    expect(screen.getByRole('img', { name: 'Velasquez.pdf' })).toHaveAttribute(
      'src',
      '/api/files/custom-preview.png'
    );
  });
});
