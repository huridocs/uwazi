/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { TestAtomStoreProvider } from '#V2/testing/index.js';
import { settingsAtom } from '#V2/atoms/index.js';
import { localeAtom } from '#V2/atoms/translationsAtoms.js';
import type { Entity } from '#V2/api/entities/types.js';
import type { MetadataProperty } from '#V2/formatters/types.js';
import { DocumentPreviewCard } from '../DocumentPreviewCard';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => children,
  t: (_ctx: string, key: string) => key,
}));

const settings = {
  languages: [
    { key: 'en', label: 'English', default: true },
    { key: 'es', label: 'Spanish' },
  ],
};

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
      language: 'eng',
    },
  ],
};

const renderCard = (
  entityOverride: Entity = entity,
  previewField?: MetadataProperty,
  locale = 'en'
) =>
  render(
    <TestAtomStoreProvider initialValues={[[localeAtom, locale], [settingsAtom, settings]]}>
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
    expect(screen.queryByText('Last Edited')).not.toBeInTheDocument();

    const factLabels = screen
      .getAllByText(/^(Type|Size|Added|Last Edited|Name)$/)
      .map(node => node.textContent);
    expect(new Set(factLabels).size).toBe(factLabels.length);

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

  it('falls back to file thumbnail when preview image errors', () => {
    renderCard(entity, {
      _id: 'p-preview',
      name: 'preview',
      label: 'Preview',
      type: 'preview',
      style: 'cover',
      values: [{ value: '/api/files/custom-preview.png', alt: 'preview' }],
    });

    const thumb = screen.getByRole('img', { name: 'Velasquez.pdf' });
    fireEvent.error(thumb);

    expect(screen.getByRole('img', { name: 'Velasquez.pdf' })).toHaveAttribute(
      'src',
      '/api/files/doc-1.jpg'
    );
  });

  it('resolves main document from entity language with default-language fallback', () => {
    const multilingual: Entity = {
      ...entity,
      language: 'fr',
      documents: [
        {
          _id: 'doc-es',
          filename: 'es.pdf',
          originalname: 'Spanish.pdf',
          mimetype: 'application/pdf',
          size: 100,
          creationDate: 1710460800,
          language: 'spa',
        },
        {
          _id: 'doc-en',
          filename: 'en.pdf',
          originalname: 'English.pdf',
          mimetype: 'application/pdf',
          size: 200,
          creationDate: 1710460800,
          language: 'eng',
        },
      ],
    };

    renderCard(multilingual, undefined, 'es');

    expect(screen.getByText('English.pdf')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'English.pdf' })).toHaveAttribute(
      'src',
      '/api/files/doc-en.jpg'
    );
  });

  it('prefers entity language over route locale for the main document', () => {
    const multilingual: Entity = {
      ...entity,
      language: 'es',
      documents: [
        {
          _id: 'doc-es',
          filename: 'es.pdf',
          originalname: 'Spanish.pdf',
          mimetype: 'application/pdf',
          size: 100,
          creationDate: 1710460800,
          language: 'spa',
        },
        {
          _id: 'doc-en',
          filename: 'en.pdf',
          originalname: 'English.pdf',
          mimetype: 'application/pdf',
          size: 200,
          creationDate: 1710460800,
          language: 'eng',
        },
      ],
    };

    renderCard(multilingual, undefined, 'en');

    expect(screen.getByText('Spanish.pdf')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Spanish.pdf' })).toHaveAttribute(
      'src',
      '/api/files/doc-es.jpg'
    );
  });

  it('resets preview failure when preview source changes', () => {
    const previewField = (src: string): MetadataProperty => ({
      _id: 'p-preview',
      name: 'preview',
      label: 'Preview',
      type: 'preview',
      style: 'cover',
      values: [{ value: src, alt: 'preview' }],
    });

    const { rerender } = render(
      <TestAtomStoreProvider initialValues={[[localeAtom, 'en'], [settingsAtom, settings]]}>
        <DocumentPreviewCard entity={entity} previewField={previewField('/bad-preview.png')} />
      </TestAtomStoreProvider>
    );

    fireEvent.error(screen.getByRole('img', { name: 'Velasquez.pdf' }));
    expect(screen.getByRole('img', { name: 'Velasquez.pdf' })).toHaveAttribute(
      'src',
      '/api/files/doc-1.jpg'
    );

    rerender(
      <TestAtomStoreProvider initialValues={[[localeAtom, 'en'], [settingsAtom, settings]]}>
        <DocumentPreviewCard entity={entity} previewField={previewField('/good-preview.png')} />
      </TestAtomStoreProvider>
    );

    expect(screen.getByRole('img', { name: 'Velasquez.pdf' })).toHaveAttribute(
      'src',
      '/good-preview.png'
    );
  });
});
